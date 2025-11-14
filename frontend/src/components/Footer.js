import React from "react";
import "../styles/Footer.css";
import PrivacyModal from "./ModalView2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    
    faFacebook,
} from "@fortawesome/free-brands-svg-icons";
import { faCopyright,faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
    return (
        <footer className="footer2">
            <div className="footer-container2">
                <div className="item1">
                    <PrivacyModal />
                </div>

                <div className="item2">
                    <span style={{ paddingRight: 5 }}>Copyright </span>
                    <FontAwesomeIcon icon={faCopyright} />{" "}
                    <span style={{ paddingLeft: 5 }}>
                        {new Date().getFullYear()} SIAM. Todos los derechos reservados.  
                       
                    </span>
                </div>
                <a
                    href="https://www.google.com/maps?ll=14.072764,-87.174164&z=16&t=m&hl=es&gl=US&mapclient=embed&cid=3518583077954966735"
                    target="_blank"
                    className="item3"
                >
                    <FontAwesomeIcon icon={faMapLocationDot} />
                </a>
                <a
                    href="https://www.facebook.com/p/Escuela-Experimental-de-Ni%C3%B1os-para-la-M%C3%BAsica-HN-100063479051786/?locale=es_LA"
                    target="_blank"
                    className="item4"
                >
                    <FontAwesomeIcon icon={faFacebook} />
                </a>

                {false && <PrivacyModal click={true} />}
            </div>
        </footer>
    );
};

export default Footer;