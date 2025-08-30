import Image from 'next/image'
import Link from 'next/link'
import { BLUR_DATA_URL } from '@/lib/blurPlaceholder'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })

interface Project {
  id: string
  title: string
  description?: string
  location?: string
  hero_image_url?: string
  featured?: boolean
}

interface TenantConfig {
  tenantId: string
  name: string
  companyProfile?: {
    name?: string
    brand_accent_hex?: string
    [key: string]: unknown
  }
  theme: {
    primaryColor: string
    secondaryColor: string
    neutralColor: string
    classes: string
  }
  features: {
    portfolio: boolean
    products: boolean
    checkout: boolean
  }
}

interface TenantPortfolioProps {
  projects: Project[]
  tenantConfig: TenantConfig
}

export function TenantPortfolio({ projects, tenantConfig }: TenantPortfolioProps) {
  const isInteriorDesign = tenantConfig.name.toLowerCase().includes('interior')
  const projectType = isInteriorDesign ? 'Interior Design' : 'Project'
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary via-blue-700 to-primary text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className={`${playfair.className} text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6`}>
              Our Portfolio
            </h1>
            <div className="w-20 md:w-28 h-1 bg-mustard mx-auto mb-6"></div>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed">
              Discover our curated collection of stunning {projectType.toLowerCase()} projects that transform spaces into extraordinary experiences
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  index={index}
                  projectType={projectType}
                />
              ))}
            </div>
          ) : (
            <EmptyPortfolio tenantConfig={tenantConfig} />
          )}
        </div>
      </section>

      {/* CTA Section */}
      <CTASection tenantConfig={tenantConfig} projectType={projectType} />
    </main>
  )
}

function ProjectCard({ project, index, projectType }: { project: Project; index: number; projectType: string }) {
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-primary/10 hover:border-mustard/40 shadow-md hover:shadow-xl transition-all duration-700 ease-out hover:-translate-y-1"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Project Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {project.hero_image_url ? (
          <Image
            src={project.hero_image_url}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            priority={index < 6}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary via-blue-600 to-mustard flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <p className="text-sm opacity-80">No Image</p>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Project Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-mustard text-brown px-3 py-1 rounded-full text-xs font-semibold">
            {projectType}
          </span>
        </div>
      </div>
      
      {/* Project Info */}
      <div className="p-8">
        <h3 className={`${playfair.className} text-2xl font-bold text-primary mb-3 group-hover:text-mustard transition-colors duration-300`}>
          {project.title}
        </h3>
        
        {project.location && (
          <p className="text-brown text-sm mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {project.location}
          </p>
        )}
        
        {project.description && (
          <p className="text-brown leading-relaxed mb-6 line-clamp-3">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-primary font-semibold">View Project</span>
          <svg className="w-5 h-5 text-mustard group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

function EmptyPortfolio({ tenantConfig }: { tenantConfig: TenantConfig }) {
  return (
    <div className="text-center py-24">
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-mustard rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>
      <h3 className={`${playfair.className} text-3xl font-bold text-primary mb-4`}>
        No Projects Yet
      </h3>
      <p className="text-brown text-lg max-w-2xl mx-auto">
        We&apos;re currently working on showcasing our amazing {tenantConfig.name.toLowerCase()} projects. 
        Check back soon to see our portfolio of stunning transformations.
      </p>
    </div>
  )
}

function CTASection({ tenantConfig, projectType }: { tenantConfig: TenantConfig; projectType: string }) {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-blue-700 to-primary text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className={`${playfair.className} text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6`}>
          Ready to Transform
          <br />
          <span className="text-mustard">Your Space?</span>
        </h2>
        <p className="text-xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed mb-8">
          Let our expert team help you create the {projectType.toLowerCase()} of your dreams. 
          Experience the {tenantConfig.name} difference today.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link 
            href="/contact" 
            className="group inline-flex items-center justify-center bg-mustard text-brown font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 shadow-[0_12px_40px_rgba(253,206,89,0.35)] hover:shadow-[0_16px_50px_rgba(253,206,89,0.55)] hover:-translate-y-0.5"
          >
            Get Free Consultation
            <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center bg-white/10 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 backdrop-blur-sm shadow-[0_12px_40px_rgba(1,88,157,0.35)] hover:bg-white/20 hover:-translate-y-0.5"
          >
            Browse Our Products
          </Link>
        </div>
      </div>
    </section>
  )
}
