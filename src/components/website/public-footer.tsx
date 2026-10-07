import { Link } from "@tanstack/react-router";
import { School, Phone, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { institution } from "@/mock";

export function PublicFooter() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  return (
    <footer className="border-t border-border bg-card/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <School className="h-4 w-4" />
              </div>
              <p className="font-urdu text-base font-bold leading-none">{institution.nameUrdu}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isUrdu
                ? "جامع تعلیمی و تربیتی ادارہ — معیاری حفظ القرآن، درسِ نظامی اور جدید عصری تعلیم۔"
                : "Center for Islamic scholarship, Hifz-ul-Quran, and modern school education across 4 campuses."}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {isUrdu ? "شعبہ جات و کیمپسز" : "Campuses & Units"}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/#campuses" className="hover:text-primary transition-colors">
                  Jamia Qasmia Baneen (Madrassa)
                </a>
              </li>
              <li>
                <a href="/#campuses" className="hover:text-primary transition-colors">
                  Jamia Zainab Banat (Madrassa)
                </a>
              </li>
              <li>
                <a href="/#campuses" className="hover:text-primary transition-colors">
                  Al-Qasim Academy (School)
                </a>
              </li>
              <li>
                <a href="/#campuses" className="hover:text-primary transition-colors">
                  Al-Zainab School (School)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {isUrdu ? "رسائی و پورٹلز" : "Portals & Links"}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-primary font-medium transition-colors">
                  {isUrdu ? "پورٹل لاگ ان (Portal Login)" : "Portal Login (All Roles)"}
                </Link>
              </li>
              <li>
                <Link to="/apply" className="hover:text-primary transition-colors">
                  {isUrdu ? "آن لائن داخلہ فارم" : "Online Admission Application"}
                </Link>
              </li>
              <li>
                <Link to="/website/gallery" className="hover:text-primary transition-colors">
                  {isUrdu ? "تصاویر و کیمپس گیلری" : "Photo & Campus Gallery"}
                </Link>
              </li>
              <li>
                <Link to="/website/contact" className="hover:text-primary transition-colors">
                  {isUrdu ? "رابطہ صفحہ" : "Contact Page"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {isUrdu ? "رابطہ کریں" : "Contact"}
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>+92-300-1234567</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>info@msmis.edu.pk</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Township Campus, Lahore / Pakistan</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {institution.nameEnglish} • {institution.nameUrdu}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hover:text-primary font-medium">
              {isUrdu ? "لاگ ان" : "Login"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
