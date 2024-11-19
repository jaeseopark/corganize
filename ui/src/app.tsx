import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Admin from "@/components/admin";
import Gallery from "@/components/gallery";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./app.css";

const Home = () => <div />;

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery fileFetchUrl="/api/images/shuffled" />} />
        <Route path="/gallery/recent" element={<Gallery fileFetchUrl="/api/images/recent" />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
