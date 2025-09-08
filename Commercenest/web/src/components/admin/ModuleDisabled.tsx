import { ExclamationTriangleIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface ModuleDisabledProps {
  moduleName: string
  moduleDescription: string
  moduleIcon?: React.ComponentType<{ className?: string }>
  contactEmail?: string
}

export function ModuleDisabled({ 
  moduleName, 
  moduleDescription, 
  moduleIcon: Icon = BriefcaseIcon,
  contactEmail = 'support@commercenest.com'
}: ModuleDisabledProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Module Not Available
            </h2>
            <div className="mt-4 flex items-center justify-center">
              <Icon className="h-8 w-8 text-gray-400 mr-2" />
              <span className="text-lg font-medium text-gray-700">{moduleName}</span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {moduleDescription}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This module is not currently activated for your tenant. 
              Contact your administrator or support team to enable this feature.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Need this module?
              </h3>
              <p className="text-sm text-blue-700">
                Contact support to discuss enabling the {moduleName.toLowerCase()} module for your account.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Link
                href={`mailto:${contactEmail}?subject=Enable ${moduleName} Module&body=Hi, I would like to enable the ${moduleName} module for my tenant. Please let me know the process and any additional costs involved.`}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Contact Support
              </Link>
              
              <Link
                href="/admin"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This is a tenant-specific module that can be enabled through the SuperAdmin dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
