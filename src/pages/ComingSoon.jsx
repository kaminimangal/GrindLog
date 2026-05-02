export default function ComingSoon({ page }) {
  return (
    <div className="ml-[240px] mt-14 p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary" style={{fontSize:'28px'}}>construction</span>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">{page}</h2>
        <p className="text-text-muted text-sm">Coming soon — we're building this next!</p>
      </div>
    </div>
  )
}
