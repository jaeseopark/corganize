import { axios } from "@/api";
import Login from "@/components/login";
import { AUTHENTICATED_ROUTES } from "@/routes";
import { useEffect, useState } from "preact/hooks";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./app.css";
import "jsoneditor-react/es/editor.min.css";

const App = () => {
  const [attempted, setAttempted] = useState(false);
  const [isAuthenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    axios
      .get("/api/jwt/check")
      .then(() => {
        setAuthenticated(true);
        setAttempted(true);
      })
      .catch((error) => {
        console.error(error);
        setAttempted(true);
      });
  }, []);

  if (!attempted) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Login isAuthenticated={isAuthenticated} />} />
        {isAuthenticated && (
          <>
            {Object.entries(AUTHENTICATED_ROUTES).map(([path, Component]) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
