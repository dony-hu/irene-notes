import {
  canAccessPost,
  findPostBySlug,
  loadPostCatalog,
  normalizePostSlug,
  proxyStaticSlide,
  unauthorizedSlideResponse,
} from '../_lib/post-access.js';

export async function onRequestGet(context) {
  const slug = normalizePostSlug(context.params.slug, '.html');

  if (!slug) {
    return new Response('Slide not found.', { status: 404 });
  }

  try {
    const posts = await loadPostCatalog(context);
    const post = findPostBySlug(posts, slug);

    if (!post || post.type !== 'webslides') {
      return new Response('Slide not found.', { status: 404 });
    }

    if (!(await canAccessPost(context, post))) {
      return unauthorizedSlideResponse(context, post, post.title);
    }

    return proxyStaticSlide(context, post, slug);
  } catch (error) {
    return new Response('Failed to load slide.', { status: 500 });
  }
}
