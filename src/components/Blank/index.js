import React, { useState, useEffect } from "react";

function Blank({ checkLocals }) {
    let isAuthenticated = false;
    let globusInfo = null;
    useEffect(() => {
        if (localStorage.getItem("isAuthenticated")) {
            isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
        }
        if (localStorage.getItem("info")) {
            globusInfo = localStorage.getItem("info");
        }
        checkLocals(isAuthenticated, globusInfo);
    }, []);
    return (
        <div>

        </div>
    )
}

export default Blank