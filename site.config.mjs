const siteConfig = {
  siteId: 'irene-notes',
  siteTitle: 'Irene的个人站',
  siteDescription: '记录想法、项目和日常笔记',
  siteKicker: '',
  heroDescription: '写点东西，记录一些有意思的事。',
  aboutText: '这是 Irene Notes 的第一版。先用最轻的方式跑起来，后续再逐步补齐搜索、归档和内容管理。',
  footerText: "Irene's Notes",
  domain: 'irene-notes.pages.dev',
  themeStorageKey: 'irene-notes-theme',
  assets: {
    faviconHref: './assets/mouse-favicon.svg',
    faviconType: 'image/svg+xml',
    bannerHref: './assets/irene-spring-girl-banner.jpg?v=202603270745',
    bannerAlt: '樱花氛围下的二次元女孩横幅',
  },
  deploy: {
    pagesProjectName: 'irene-notes',
    wranglerName: 'irene-notes',
  },
};

export default siteConfig;
