const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])
const TAG_NAME = 'playground-global-header'

class PlaygroundGlobalHeader extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' })
    }
    this.render()
  }

  getResolvedHomeHref() {
    const isLocalHost = LOCAL_HOSTS.has(window.location.hostname)
    const localHref = this.getAttribute('home-local-href')
    const defaultHref = this.getAttribute('home-href') || '/'
    return isLocalHost && localHref ? localHref : defaultHref
  }

  render() {
    const brand = this.getAttribute('brand') || 'da-mr.com'
    const homeLabel = this.getAttribute('home-label') || 'Dashboard'
    const currentPage = this.getAttribute('current-page')
    const isHomePage = currentPage === 'home'
    const homeHref = this.getResolvedHomeHref()

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
        }

        .header {
          background: rgba(3, 3, 6, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.85rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .lead {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          flex-shrink: 1;
        }

        .brand {
          font-family: 'Syne', 'Inter', system-ui, sans-serif;
          font-weight: 800;
          font-size: 0.95rem;
          letter-spacing: -0.02em;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
        }

        .home-link,
        .home-current {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: #cbd5e1;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          padding: 0.3rem 0.5rem 0.3rem 0.4rem;
        }

        .home-link {
          text-decoration: none;
          transition:
            color 0.2s ease,
            background 0.2s ease;
        }

        .home-link-icon {
          width: 0.85rem;
          height: 0.85rem;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        @media (max-width: 640px) {
          .home-link,
          .home-current {
            padding: 0.35rem;
          }

          .home-label {
            display: none;
          }
        }

        .home-link:hover,
        .home-link:focus-visible {
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
          outline: none;
        }

        .home-link:hover .home-link-icon,
        .home-link:focus-visible .home-link-icon {
          transform: translateX(-2px);
        }

        .home-current {
          cursor: default;
        }

        .home-current-dot {
          width: 0.4rem;
          height: 0.4rem;
          border-radius: 50%;
          background: #a5b4fc;
          box-shadow: 0 0 8px rgba(165, 180, 252, 0.7);
          flex-shrink: 0;
          margin: 0 0.225rem;
        }

        .actions-divider {
          width: 1px;
          height: 1.1rem;
          background: rgba(255, 255, 255, 0.12);
          flex-shrink: 0;
        }
      </style>
      <header class="header">
        <div class="inner">
          <div class="lead">
            ${
              isHomePage
                ? `<span class="home-current" aria-current="page"><span class="home-current-dot" aria-hidden="true"></span><span class="home-label">${homeLabel}</span></span>`
                : `<a class="home-link" href="${homeHref}" aria-label="${homeLabel}"><svg class="home-link-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 12.5 5.5 8 10 3.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="home-label">${homeLabel}</span></a>`
            }
            <span class="actions-divider" aria-hidden="true"></span>
            <span class="brand">${brand}</span>
          </div>
          <div class="actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </header>
    `
  }
}

export function registerGlobalHeader() {
  if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, PlaygroundGlobalHeader)
  }
}
