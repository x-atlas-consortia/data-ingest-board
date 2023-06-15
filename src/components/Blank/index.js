import React, { useState, useEffect } from "react";

function Blank({ checkLocals }) {
    let isAuthenticated = false;
    useEffect(() => {
        if (localStorage.getItem("isAuthenticated")) {
            isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
        }
        checkLocals(isAuthenticated);
    }, []);
    return (
        <div>

        </div>
    )
}

export default Blank