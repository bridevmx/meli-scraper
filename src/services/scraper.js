import axios from 'axios';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import { withRetries } from '../utils/helpers.js';

function getRandomUserAgent() {
  return new UserAgent({ platform: 'Win32' }).toString();
}

async function scrapePageAndGetState(url) {
  return withRetries(async () => {
    const headers = { 'User-Agent': getRandomUserAgent(), Accept: 'text/html,application/xhtml+xml' };

    const proxyConfig = {
      host: process.env.PROXY_HOST,
      port: process.env.PROXY_PORT,
      auth: {
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD
      },
      protocol: 'http'
    };

    const resp = await axios.get(url, {
      headers,
      proxy: proxyConfig,
      validateStatus: () => true,
      timeout: 25_000
    });

    if (resp.status >= 500) {
      throw new Error(`HTTP ${resp.status} on ${url}`);
    }
    if (resp.status >= 400 && resp.status < 500) {
      throw new Error(`HTTP ${resp.status} on ${url}`);
    }

    const preloadedState = getPreloadedState(resp.data);
    const $ = cheerio.load(resp.data);

    return { preloadedState, $ };
  }, { label: `scrapeAndParse ${url}` });
}


function getPreloadedState(html) {
  const $ = cheerio.load(html);
  const scriptJsonById = $('script#__PRELOADED_STATE__');
  if (scriptJsonById.length > 0) {
    return JSON.parse(scriptJsonById.html());
  }
  const scriptTagWithContent = $('script:contains("window.__PRELOADED_STATE__")');
  if (scriptTagWithContent.length > 0) {
    const scriptContent = scriptTagWithContent.html();
    const match = scriptContent.match(/window\.__PRELOADED_STATE__\s*=\s*({.+});/);
    if (match && match[1]) return JSON.parse(match[1]);
  }
  throw new Error('No __PRELOADED_STATE__ found');
}


function parseOfferProduct(item, trackingData) {
  const card = item.card;
  const metadata = card.metadata;
  const components = card.components;
  const findComponent = (type) => components.find((c) => c.type === type);
  const titleComp = findComponent('title');
  const priceComp = findComponent('price');
  const reviewsComp = findComponent('reviews');
  const shippingComp = findComponent('shipping');
  const brandComp = findComponent('brand');
  const productId = metadata.id;
  const additionalData = trackingData[productId] || {};
  const imageId = card.pictures?.pictures?.[0]?.id;
  const imageUrl = imageId ? `https://http2.mlstatic.com/D_Q_NP_2X_${imageId}-AB.webp` : null;
  const productUrl = metadata.product_id
    ? `https://www.mercadolibre.com.mx/p/${metadata.product_id}`
    : `https://${metadata.url?.split('#')[0]}`;

  return {
    id: productId,
    title: titleComp?.title?.text,
    brand: brandComp?.brand?.text || null,
    url: productUrl,
    imageUrl,
    price: priceComp?.price?.current_price?.value,
    previousPrice: priceComp?.price?.previous_price?.value || null,
    discount: priceComp?.price?.discount?.value || null,
    currency: 'MXN',
    rating: reviewsComp?.reviews?.rating_average || null,
    votes: reviewsComp?.reviews?.total || null,
    shipping: {
      text: shippingComp?.shipping?.text,
      isFull: shippingComp?.shipping?.icon?.key === 'vpp_full_icon',
    },
    tags: additionalData.tags || [],
  };
}

function parseSearchProduct(item) {
  const card = item.polycard;
  if (!card) return null;
  const metadata = card.metadata;
  const components = card.components;
  const findComponent = (type) => components.find((c) => c.type === type);
  const titleComp = findComponent('title');
  const priceComp = findComponent('price');
  const reviewsComp = findComponent('reviews');
  const shippingComp = findComponent('shipping');
  const shippedFromComp = findComponent('shipped_from');
  const brandComp = findComponent('brand');
  const imageId = card.pictures?.pictures?.[0]?.id;
  const imageUrl = imageId ? `https://http2.mlstatic.com/D_Q_NP_2X_${imageId}-AB.webp` : null;
  const productUrl = metadata.product_id
    ? `https://www.mercadolibre.com.mx/p/${metadata.product_id}`
    : `https://articulo.mercadolibre.com.mx/${metadata.id.toLowerCase().replace(/^mlm/, 'MLM-')}-${titleComp?.title?.text?.toLowerCase().replace(/\s+/g, '-').substring(0, 50)}`;

  return {
    id: metadata.id,
    title: titleComp?.title?.text,
    brand: brandComp?.brand?.text || null,
    url: productUrl,
    imageUrl,
    price: priceComp?.price?.current_price?.value,
    previousPrice: priceComp?.price?.previous_price?.value || null,
    discount: priceComp?.price?.discount?.value || null,
    currency:  'MXN',
    rating: reviewsComp?.reviews?.rating_average || null,
    votes: reviewsComp?.reviews?.total || null,
    shipping: { text: shippingComp?.shipping?.text, isFull: !!shippedFromComp },
    tags: [item.type === 'PERSO' ? 'promoted' : 'organic'],
  };
}

function parseProductPageJSON(initialState) {
  const components = initialState.components;
  const productData = { features: {}, stock: {}, sellerInfo: {} };

  productData.id = initialState.id || components.track?.event_data?.item_id;
  productData.title = components.header?.title;
  productData.price = components.price?.price?.value;
  productData.previousPrice = components.price?.price?.original_value || null;
  productData.currency = 'MXN';
  productData.description = components.description?.content;
  productData.highlightTag = components.highlights?.tag_action?.label?.text || null;

  const reviewsComponent = components.reviews_capability_v3;
  productData.rating = {
    ratingValue: reviewsComponent?.rating?.average || null,
    ratingCount: reviewsComponent?.rating?.amount || null,
    reviewCount: parseInt(reviewsComponent?.total_opinions?.match(/\d+/)?.[0]) || 0,
  };
  productData.reviews = reviewsComponent?.reviews?.map((r) => ({
    text: r.comment?.content?.text,
    rating: r.rating,
    date: r.comment?.date,
  })) || [];

  const pictureConfig = components.gallery?.picture_config;
  const pictures = components.gallery?.pictures;
  if (pictureConfig && pictures) {
    productData.images = pictures.map((pic) => ({
      standard: pictureConfig.template?.replace('{id}', pic.id).replace('{sanitizedTitle}', pic.sanitized_title || ''),
      highRes: pictureConfig.template_2x?.replace('{id}', pic.id).replace('{sanitizedTitle}', pic.sanitized_title || ''),
    }));
  }

  productData.stock = {
    status: components.stock_information?.title?.text || null,
    availableQuantity: components.available_quantity?.picker?.description?.replace(/\(|\)/g, '') || null,
  };

  const sellerData = components.seller_experiment?.seller_info || components.seller_data;
  if (sellerData) {
    productData.sellerInfo = {
      name: sellerData.title || components.seller_experiment?.seller_link?.label?.text,
      reputationLevel: sellerData.power_seller_status?.title || null,
      salesCount: components.seller_experiment?.subtitles?.[0]?.text || components.seller_experiment?.subtitles?.[0]?.values?.bold_amount?.text || null,
    };
  }

  productData.variations = components.outside_variations?.pickers?.map((picker) => ({
    name: picker.label?.text?.replace(':', ''),
    selectedValue: picker.selected_option?.text,
    options: picker.products?.map((p) => ({ value: p.label?.text, available: !p.stock?.text?.includes('Sin stock') })),
  })) || [];

  const specsContainer = components.highlighted_specs_attrs_swap || components.highlighted_specs_attrs;
  if (specsContainer) {
    const specsComponent = specsContainer.components?.find((c) => c.id === 'technical_specifications');
    if (specsComponent?.specs) {
      specsComponent.specs.forEach((specGroup) => {
        if (specGroup.attributes) {
          specGroup.attributes.forEach((attr) => { productData.features[attr.id] = attr.text; });
        }
      });
    }
  }
  return productData;
}

export async function scrapeOffers(maxPages = 1) {
  let currentPageUrl = 'https://www.mercadolibre.com.mx/ofertas';
  let pages = 0;
  const allProducts = [];

  while (currentPageUrl && (maxPages === 0 || pages < maxPages)) {
    const { preloadedState, $ } = await scrapePageAndGetState(currentPageUrl);
    const items = preloadedState.data.items || [];
    const trackingData = preloadedState.data.trackingAdditionalData || {};
    const productsOnPage = items.map((it) => parseOfferProduct(it, trackingData));
    allProducts.push(...productsOnPage);

    pages++;
    const next = $('.andes-pagination__button--next:not(.andes-pagination__button--disabled) .andes-pagination__link').attr('href') || null;
    currentPageUrl = next;
  }
  return allProducts;
}

export async function scrapeSearch(searchTerm, maxPages = 1) {
  const searchTermFormatted = searchTerm.trim().replace(/\s+/g, '-');
  const urlFormat = searchTermFormatted.replaceAll('-', '%20');
  let currentPageUrl = `https://listado.mercadolibre.com.mx/${searchTermFormatted}#D[A:${urlFormat}]`;
  let pages = 0;
  const allProducts = [];

  while (currentPageUrl && (maxPages === 0 || pages < maxPages)) {
    const { preloadedState, $ } = await scrapePageAndGetState(currentPageUrl);
    const results = preloadedState.pageStoreState?.search?.results || [];
    const productsOnPage = results.map((r) => parseSearchProduct(r)).filter(Boolean);
    allProducts.push(...productsOnPage);

    pages++;
    const next = $('.andes-pagination__button--next:not(.andes-pagination__button--disabled) .andes-pagination__link').attr('href') || null;
    currentPageUrl = next;
  }
  return allProducts;
}

export async function scrapeProductPage(productUrl) {
  const { preloadedState } = await scrapePageAndGetState(productUrl);
  const details = parseProductPageJSON(preloadedState.pageState.initialState);
  return details;
}
