// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Graphlet - Modern Mermaid Diagram Editor',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Graphlet is a beautiful, modern editor for Mermaid diagrams. Create flowcharts, sequence diagrams, and more with a real-time preview.' },
        { name: 'keywords', content: 'mermaid, diagram, editor, flowchart, sequence diagram, charts, visualization, developer tools' },
        { name: 'theme-color', content: '#13131f' },
        // Open Graph
        { property: 'og:site_name', content: 'Graphlet' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://graphlet.xyz' },
        { property: 'og:title', content: 'Graphlet - Modern Mermaid Diagram Editor' },
        { property: 'og:description', content: 'Create beautiful Mermaid diagrams with a modern, real-time editor.' },
        { property: 'og:image', content: 'https://graphlet.xyz/og-image.png' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Graphlet - Modern Mermaid Diagram Editor' },
        { name: 'twitter:description', content: 'Create beautiful Mermaid diagrams with a modern, real-time editor.' },
        { name: 'twitter:image', content: 'https://graphlet.xyz/og-image.png' },
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Graphlet',
            'applicationCategory': 'DeveloperApplication',
            'operatingSystem': 'Any',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            },
            'description': 'A beautiful, modern editor for Mermaid diagrams.'
          })
        }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'canonical', href: 'https://graphlet.xyz' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap' }
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
