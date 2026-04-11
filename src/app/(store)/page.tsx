export default function HomePage() {
  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: "center", padding: "var(--space-20) 0" }}>
          <h1 style={{ marginBottom: "var(--space-4)" }}>
            Moda con <span className="font-editorial" style={{ color: "var(--accent-primary)" }}>alma orgánica</span>
          </h1>
          <p className="text-secondary" style={{ fontSize: "var(--text-lg)", maxWidth: "480px", margin: "0 auto var(--space-8)" }}>
            Descubrí prendas que visten con intención. Envíos a todo el país.
          </p>
          <a href="/tienda" className="btn btn-primary btn-lg">
            Ver Colección
          </a>
        </div>
      </div>
    </section>
  );
}
