import "./userLoading.css";

export default function UserLoading() {
  return (
    <div className="loading-screen user-bg">
      <img src="/arellano.png" alt="Loading" className="loading-image" />
      <p className="loading-text">Loading Home...</p>
    </div>
  );
}
