import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Admin from "@/components/admin";
import Gallery from "@/components/gallery";

import "./app.css";

const Home = () => <div />;

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
