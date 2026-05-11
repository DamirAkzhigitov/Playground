function initYear() {
  const year = document.getElementById('year')
  if (year) {
    year.textContent = String(new Date().getFullYear())
  }
}

function initLocalProjectLinks() {
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(
    window.location.hostname
  )

  if (!isLocalHost) return

  const resumeLink = document.getElementById('resume-project-link')
  if (!(resumeLink instanceof HTMLAnchorElement)) return

  const localHref = resumeLink.dataset.localHref
  if (localHref) {
    resumeLink.href = localHref
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initYear()
  initLocalProjectLinks()
})
