import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/apartments', label: 'Apartments' },
  { to: '/questions', label: 'Questions' },
  { to: '/compare', label: 'Compare' },
  { to: '/export', label: 'Export' }
]

export function AppLayout() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-4">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
          {tabs.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  `text-sm ${isActive ? 'font-semibold text-blue-600' : 'text-gray-600'}`
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}
