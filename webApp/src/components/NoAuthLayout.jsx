import React from "react";
import Navbar from "./fragments/Navbar";
import Footer from "./fragments/Footer";

export default function NoAuthLayout({ children }) {
  return (
    <div>
      {/* <Navbar /> */}
      <main>{children}</main>
      {/* <Footer /> */}
    </div>
  );
}
