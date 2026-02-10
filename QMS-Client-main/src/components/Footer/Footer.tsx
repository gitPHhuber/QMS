import Logo from "assets/images/logo.svg";
import PhoneIcon from "assets/icons/Phone.svg";
import MailIcon from "assets/icons/mail.svg";
import LogoVK from "assets/icons/logoVK.svg";
import LogoYT from "assets/icons/logoYOUT.svg";

export const Footer: React.FC = () => {
  return (
    <div className="flex justify-between items-center px-8 py-4 bg-asvo-dark border-t border-asvo-dark-3/50 text-asvo-muted">
      <div className="flex items-center">
        <img src={Logo} alt="Logo" className="h-6 mr-2" />
        <div>
          <div className="text-asvo-light text-sm font-medium">© 2018-2025 ASVO-QMS</div>
        </div>
      </div>

      <div className="flex flex-col items-center text-sm">
        <div className="flex items-center mb-1">
          <img src={PhoneIcon} alt="Phone" className="h-4 mr-2 opacity-60" />
          <div>+7 (499) 455 04 13</div>
        </div>
        <div className="flex items-center">
          <img src={MailIcon} alt="Mail" className="h-4 mr-2 opacity-60" />
          <div className="text-asvo-accent">info@asvo-qms.ru</div>
        </div>
      </div>

      <div className="flex items-center">
        <img src={LogoVK} alt="VK" className="h-8 mr-4 opacity-60 hover:opacity-100 transition-opacity" />
        <img src={LogoYT} alt="YouTube" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
