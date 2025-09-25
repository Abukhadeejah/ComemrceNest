'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useAdminBranding } from '@/components/admin/AdminBrandingWrapper'

interface AdminHeaderProps {
  onMenuClick: () => void
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export function AdminHeader({ onMenuClick, title, breadcrumbs }: AdminHeaderProps) {
  const brandingConfig = useAdminBranding()
  
  return (
    <div className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 ${
      brandingConfig?.headerBg || 'border-gray-200 bg-white'
    }`}>
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      {/* Breadcrumbs */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex" aria-label="Breadcrumb">
              <ol role="list" className="flex items-center space-x-4">
                {breadcrumbs.map((breadcrumb, index) => (
                  <li key={index}>
                    <div className="flex items-center">
                      {index > 0 && (
                        <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                      )}
                      {breadcrumb.href ? (
                        <Link
                          href={breadcrumb.href}
                          className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          {breadcrumb.label}
                        </Link>
                      ) : (
                        <span className="ml-4 text-sm font-medium text-gray-700">
                          {breadcrumb.label}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">View notifications</span>
          <BellIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

        {/* Profile dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="-m-1.5 flex items-center p-1.5">
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">A</span>
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
            <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/admin/profile"
                    className={`${
                      active ? 'bg-gray-50' : ''
                    } block px-3 py-1 text-sm leading-6 text-gray-900`}
                  >
                    Your profile
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <form action="/api/auth/signout" method="post">
                    <button
                      type="submit"
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900`}
                    >
                      Sign out
                    </button>
                  </form>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  )
}

