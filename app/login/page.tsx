import PasswordForm from "@/components/PasswordForm";

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center" }}>おてつだいきゅうよ</h1>
      <div className="card">
        <PasswordForm />
      </div>
    </main>
  );
}
