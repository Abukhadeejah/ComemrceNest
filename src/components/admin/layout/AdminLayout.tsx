'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: BreadcrumbItem[]
}

export function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  return (
    <>
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 bg-gray-50">
          {/* Page Title Section */}
          {title && (
            <div className="bg-white border-b border-gray-200">
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav className="mb-3 flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                      {breadcrumbs.map((item, index) => (
                        <li key={index} className="flex items-center">
                          {index > 0 && (
                            <svg
                              className="h-5 w-5 flex-shrink-0 text-gray-400 mx-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                            </svg>
                          )}
                          {item.href ? (
                            <a
                              href={item.href}
                              className="text-sm font-medium text-gray-500 hover:text-gray-700"
                            >
                              {item.label}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {item.label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
                
                {/* Page Title */}
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            </div>
          )}
          
          {/* Page Content */}
          {children}
        </main>
      </div>
    </>
  )
}
