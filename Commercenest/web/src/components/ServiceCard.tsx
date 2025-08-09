type Props = { title: string; description: string }

export default function ServiceCard({ title, description }: Props) {
  return (
    <div className="rounded-lg border p-5 transition hover:border-mustard">
      <div className="text-lg font-semibold text-primary">{title}</div>
      <p className="mt-2 text-sm text-neutral-700">{description}</p>
    </div>
  )
}


