import {
  canAccessPost,
  findPostBySlug,
  loadPostCatalog,
  normalizePostSlug,
  proxyStaticSlide,
  redirectToPath,
  resolveSlideAssetPath,
  unauthorizedSlideResponse,
} from './_lib/post-access.js';

export async function onRequest(context) {
  const method = String(context.request.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    return context.next();
  }

  const slug = normalizePostSlug(context.params.slug, '.html');
  const raw = String(context.params.slug || '');

  if (!slug || !raw.toLowerCase().endsWith('.html')) {
    return context.next();
  }

  try {
    const posts = await loadPostCatalog(context);
    const post = findPostBySlug(posts, slug);

    if (!post || post.type !== 'webslides') {
      return context.next();
    }

    const requestUrl = new URL(context.request.url);
    const slidePath = resolveSlideAssetPath(post, slug);

    if (requestUrl.pathname !== slidePath) {
      return redirectToPath(slidePath, requestUrl.search);
    }

    if (!(await canAccessPost(context, post))) {
      return unauthorizedSlideResponse(context, post, post.title);
    }

    return proxyStaticSlide(context, post, slug);
  } catch (error) {
    return context.next();
  }
}
