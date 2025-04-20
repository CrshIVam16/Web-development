"use client"; // Ensures this component runs only on the client side in Next.js

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
    const router = useRouter();
    const [currentCompany, setCurrentCompany] = useState(null);
    const [companyLoggedIn, setCompanyLoggedIn] = useState(false);

    // Fetch sessionStorage data safely in useEffect
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedCompany = JSON.parse(sessionStorage.getItem("company"));
            setCurrentCompany(storedCompany);
            setCompanyLoggedIn(storedCompany !== null);
        }
    }, []);

    const companyLogout = () => {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("company");
            setCurrentCompany(null);
            setCompanyLoggedIn(false);
        }
        router.push("/compLogin");
    };

    return (
        <CompanyContext.Provider value={{
            companyLoggedIn,
            setCompanyLoggedIn,
            currentCompany,
            setCurrentCompany,
            companyLogout
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

// Custom Hook for easy access to context
const useCompanyContext = () => useContext(CompanyContext);
export default useCompanyContext;
