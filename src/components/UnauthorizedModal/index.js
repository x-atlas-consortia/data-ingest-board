import React, { useState, useEffect } from "react";
import { Roboto } from 'next/font/google';

const UnauthorizedModal = ({ onLogout }) => {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Unauthorized Access</h2>
                <p>You are logged in to an account without access. Please log out and log back in with a HuBMAP Consortium Registered Account</p>
                <button onClick={onLogout}>Log Out</button>
            </div>
        </div>
    );
};

export default UnauthorizedModal;