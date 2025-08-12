import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  User as UserIcon,
  LogOut,
  Globe,
  ChevronDown,
  Shield,
  Users,
  BookOpen,
  Award,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import logoBadak from "@/assets/logobadak.png";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { supabase } from "@/lib/supabaseClient";
import { type Session } from "@supabase/supabase-js";

const FloatingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleDropdown = (menu: string) => {
    setOpenDropdown((prevState) => (prevState === menu ? null : menu));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown &&
        !(event.target as Element).closest(".navigation-menu")
      ) {
        setOpenDropdown(null);
      }
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, isUserMenuOpen]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const userFirstName = session?.user?.user_metadata?.full_name?.split(" ")[0] || "User";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Top Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm border-b border-primary-foreground/10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>badak@lng</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <Globe className="h-3 w-3" />
            <span>EN | FR | ES</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? "top-0 mx-4 lg:mx-8" : "top-0 mx-0"
        }`}
      >
        <nav
          className={`mt-8 transition-all duration-700 ease-in-out ${
            isScrolled
              ? "bg-background/95 backdrop-blur-sm shadow-lg border border-border/50 rounded-2xl mx-auto"
              : "bg-background/80 backdrop-blur-sm shadow-lg border-b border-border/50 rounded-none w-full"
          } px-6 py-3`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src={logoBadak}
                alt="HSE Badak LNG Logo"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">BADAK LNG</h1>
                <p className="text-xs text-black/90">Fire Training Ground</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              <NavigationMenu className="navigation-menu">
                <NavigationMenuList className="space-x-2">
                  {/* Untuk menu Training Programs */}
                  <NavigationMenuItem>
                    <button
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium 
                      transition-colors ${
                        openDropdown === "training"
                          ? "bg-accent text-accent-foreground"
                          : "bg-transparent hover:bg-accent hover:text-accent-foreground"
                      } focus:outline-none`}
                      onClick={() => handleDropdown("training")}
                      aria-expanded={openDropdown === "training"}
                    >
                      Training Programs
                      <ChevronDown
                        className={`ml-1 h-4 w-4 transition-transform duration-200 
                        ${
                          openDropdown === "training"
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      />
                    </button>
                    {openDropdown === "training" && (
                      <div
                        className="absolute top-full left-0 mt-2 w-[400px] rounded-md border bg-popover p-4 shadow-md 
                        transition-all duration-200 ease-in-out 
                        hover:shadow-lg" // tambahkan hover effect
                      >
                        <div className="grid gap-3 p-6 w-full">
                          <div className="row-span-3">
                            <NavigationMenuLink asChild>
                              <a className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary p-6 no-underline outline-none focus:shadow-md">
                                <Shield className="h-6 w-6 text-primary-foreground" />
                                <div className="mb-2 mt-4 text-lg font-medium text-primary-foreground">
                                  Fire Safety Training
                                </div>
                                <p className="text-sm leading-tight text-primary-foreground/90">
                                  Comprehensive fire safety and emergency
                                  response training programs.
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </div>
                          <NavigationMenuLink asChild>
                            <a
                              onClick={() => {
                                navigate("/training");
                                setOpenDropdown(null);
                              }}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                            >
                              <div className="text-sm leading-none font-semibold">
                                HSE Certification
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug opacity-80">
                                Health, safety, and environmental certification
                                programs.
                              </p>
                            </a>
                          </NavigationMenuLink>
                          <NavigationMenuLink asChild>
                            <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                              <div className="text-sm leading-none font-semibold">
                                Emergency Response
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug opacity-80">
                                Advanced emergency response and crisis
                                management.
                              </p>
                            </a>
                          </NavigationMenuLink>
                        </div>
                      </div>
                    )}
                  </NavigationMenuItem>

                  {/* Untuk menu Services */}
                  <NavigationMenuItem>
                    <button
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium 
                      transition-colors ${
                        openDropdown === "services"
                          ? "bg-accent text-accent-foreground"
                          : "bg-transparent hover:bg-accent hover:text-accent-foreground"
                      } focus:outline-none`}
                      onClick={() => handleDropdown("services")}
                      aria-expanded={openDropdown === "services"}
                    >
                      Services
                      <ChevronDown
                        className={`ml-1 h-4 w-4 transition-transform duration-200 
                        ${
                          openDropdown === "services"
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      />
                    </button>
                    {openDropdown === "services" && (
                      <div className="absolute top-full left-0 mt-2 w-[500px] rounded-md border bg-popover p-4 shadow-md grid grid-cols-2 gap-3">
                        <NavigationMenuLink asChild>
                          <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <div className="text-sm font-medium leading-none">
                                Consultation
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Professional safety consultation and assessment
                              services.
                            </p>
                          </a>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4" />
                              <div className="text-sm font-medium leading-none">
                                Documentation
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Safety documentation and compliance management.
                            </p>
                          </a>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center space-x-2">
                              <Award className="h-4 w-4" />
                              <div className="text-sm font-medium leading-none">
                                Certification
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Professional certification and accreditation
                              programs.
                            </p>
                          </a>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4" />
                              <div className="text-sm font-medium leading-none">
                                Risk Assessment
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Comprehensive workplace risk assessment and
                              mitigation.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </div>
                    )}
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink
                      onClick={() => navigate("/news")}
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer"
                    >
                      News
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink
                      onClick={() => scrollToSection("contact")}
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer"
                    >
                      Contact
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <div className="flex items-center space-x-3 ml-6">
                <Button size="sm" variant="outline" className="h-9">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {session ? (
                  <div className="relative" ref={userMenuRef}>
                    <Button
                      variant="ghost"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 h-9 px-3"
                    >
                      <UserIcon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{userFirstName}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                    </Button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-background rounded-md shadow-lg border py-1 z-10">
                        <button onClick={handleLogout} className="w-full text-left flex items-center px-3 py-2 text-sm hover:bg-accent">
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => navigate("/auth")}
                    className="h-9 bg-primary hover:bg-primary/90"
                  >
                    Join Us
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 p-4 bg-background/95 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-left p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-foreground"
                >
                  Training Programs
                </button>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-left p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-foreground"
                >
                  Services
                </button>
                <button
                  onClick={() => navigate("/news")}
                  className="text-left p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-foreground"
                >
                  News
                </button>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-left p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-foreground"
                >
                  Contact
                </button>
                {session ? (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2 font-medium">
                        <UserIcon className="h-5 w-5 text-primary" />
                        <span>{userFirstName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-border/50">
                    <Button onClick={() => { navigate("/auth"); setIsMobileMenuOpen(false); }} className="w-full bg-primary hover:bg-primary/90">
                      Join Us
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  );
};

export default FloatingHeader;
