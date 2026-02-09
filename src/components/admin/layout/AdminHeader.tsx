'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useAdminBranding } from '@/components/admin/AdminBrandingWrapper'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const brandingConfig = useAdminBranding()
  
  return (
    <header className={`sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 shadow-sm sm:px-6 lg:px-8 backdrop-blur-md bg-white/95 ${
      brandingConfig?.headerBg ? 'border-gray-200' : 'border-gray-200'
    }`}>
      {/* Mobile menu button - ALWAYS VISIBLE ON MOBILE */}
      <button
        type="button"
        className="p-2 text-gray-700 hover:text-gray-900 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator - Mobile only */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      {/* Spacer to push items to the right */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-x-3 lg:gap-x-4">
        {/* Notifications */}
        <button type="button" className="p-2 text-gray-400 hover:text-gray-500 rounded-md">
          <span className="sr-only">View notifications</span>
          <BellIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separator - Desktop only */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

        {/* Profile dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center p-1.5 hover:bg-gray-50 rounded-full transition-colors">
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
              <Menu.Item>
                {({ active }: { active: boolean }) => (
                  <Link
                    href="/admin/profile"
                    className={`${active ? 'bg-gray-50' : ''} block px-4 py-2 text-sm text-gray-900`}
                  >
                    Your profile
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }: { active: boolean }) => (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/auth/signout', {
                          method: 'POST',
                          credentials: 'include'
                        })
                        const data = await response.json()
                        if (data.redirectUrl) {
                          window.location.href = data.redirectUrl
                        } else {
                          window.location.href = '/login'
                        }
                      } catch (error) {
                        console.error('Signout error:', error)
                        window.location.href = '/login'
                      }
                    }}
                    className={`${active ? 'bg-gray-50' : ''} block w-full text-left px-4 py-2 text-sm text-gray-900`}
                  >
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  )
}
