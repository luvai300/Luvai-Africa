"use client";
import PwaInstall from "../components/pwa-install";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  Plus,
  X,
  Heart,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  ImagePlus,
  Store,
  Package,
  LogOut,
  SlidersHorizontal,
  Menu,
  Copy,
  ExternalLink,
  Leaf,
  MessageCircle,
  Flag,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  market,
  photo,
  price,
  slugify,
  whatsapp,
  humanError,
  compressPhoto,
  CATEGORIES,
  type Product,
  type Artisan,
} from "../lib/market";
const PAGE = 24;
function Vessel({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "vessel small" : "vessel"}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M72 38h56M77 39v28c0 14-36 27-36 65 0 36 25 48 59 48s59-12 59-48c0-38-36-51-36-65V39"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M48 108c25 16 79 16 104 0M43 132c28 15 86 15 114 0M51 155c25 12 73 12 98 0"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M83 46h34M82 57h36" stroke="currentColor" />
      <path
        d="M161 48v22m-11-11h22M38 59v12m-6-6h12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
function App() {
  const [user, setUser] = useState<User | null>(null),
    [authReady, setAuthReady] = useState(false),
    [profile, setProfile] = useState<Artisan | null>(null),
    [view, setView] = useState<"market" | "makers" | "studio">("market");
  const [products, setProducts] = useState<Product[]>([]),
    [makers, setMakers] = useState<Artisan[]>([]),
    [myProducts, setMyProducts] = useState<Product[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All pieces"),
    [sort, setSort] = useState("newest"),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false),
    [currency, setCurrency] = useState("All currencies"),
    [saved, setSaved] = useState<string[]>([]),
    [onlySaved, setOnlySaved] = useState(false),
    [filters, setFilters] = useState(false),
    [menu, setMenu] = useState(false),
    [studioTab, setStudioTab] = useState("All");
  const [modal, setModal] = useState<any>(null),
    [selected, setSelected] = useState<Product | null>(null),
    [selectedMaker, setSelectedMaker] = useState<Artisan | null>(null),
    [makerPieces, setMakerPieces] = useState<Product[]>([]),
    [makerPage, setMakerPage] = useState(0),
    [makerMore, setMakerMore] = useState(false),
    [activePhoto, setActivePhoto] = useState(0),
    [notice, setNotice] = useState(""),
    [formError, setFormError] = useState(""),
    [authMode, setAuthMode] = useState("signup"),
    [authEmail, setAuthEmail] = useState(""),
    [recovery, setRecovery] = useState(false),
    [authMessage, setAuthMessage] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]),
    [uploading, setUploading] = useState(false),
    [editing, setEditing] = useState<Product | null>(null),
    [editorId, setEditorId] = useState(""),
    [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    dialogRef = useRef<HTMLDivElement>(null),
    returnFocus = useRef<HTMLElement | null>(null),
    fetchId = useRef(0),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((s: string) => {
    setNotice(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(""), 5000);
  }, []);
  function open(m: any) {
    returnFocus.current = document.activeElement as HTMLElement;
    setFormError("");
    setAuthMessage("");
    setSelected(null);
    setSelectedMaker(null);
    setModal(m);
    setMenu(false);
  }
  function close() {
    if (busy || uploading) return;
    setModal(null);
    setSelected(null);
    setSelectedMaker(null);
    setRecovery(false);
    setActivePhoto(0);
    returnFocus.current?.focus();
  }
  const active = !!modal || !!selected || !!selectedMaker;
  useEffect(() => {
    if (!active) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() =>
      dialogRef.current?.querySelector<HTMLElement>("button,input,a")?.focus(),
    );
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!busy && !uploading) {
          setModal(null);
          setSelected(null);
          setSelectedMaker(null);
          returnFocus.current?.focus();
        }
      }
      if (e.key === "Tab") {
        const els = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
    };
  }, [active, busy, uploading]);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("luvai-market-saved") || "[]"));
    } catch {}
    const sb = market();
    sb.auth.getSession().then(({ data, error }) => {
      if (error) setLoadError(humanError(error));
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        setModal({ type: "password" });
      }
    });
    return () => {
      subscription.unsubscribe();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    let valid = true;
    if (!user) {
      setProfile(null);
      setMyProducts([]);
      return;
    }
    market()
      .from("luvai_artisans")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!valid) return;
        if (error) toast(humanError(error));
        else setProfile(data as Artisan | null);
      });
    return () => {
      valid = false;
    };
  }, [user, toast]);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);
  const loadProducts = useCallback(async () => {
    const id = ++fetchId.current;
    setLoading(true);
    setLoadError("");
    let q = market()
      .from("luvai_products")
      .select("*, artisan:luvai_artisans(*)")
      .eq("status", "published");
    if (category !== "All pieces") q = q.eq("category", category);
    if (search) q = q.ilike("title", `%${search.replace(/[%_\\]/g, "")}%`);
    if (currency !== "All currencies") q = q.eq("currency", currency);
    if (onlySaved) {
      if (!saved.length) {
        setProducts([]);
        setMore(false);
        setLoading(false);
        return;
      }
      q = q.in("id", saved);
    }
    q =
      sort === "price-low"
        ? q.order("price_minor", { ascending: true }).order("id")
        : sort === "price-high"
          ? q.order("price_minor", { ascending: false }).order("id")
          : q.order("created_at", { ascending: false }).order("id");
    const { data, error } = await q.range(page * PAGE, page * PAGE + PAGE);
    if (id !== fetchId.current) return;
    if (error) {
      setLoadError(humanError(error));
      setProducts([]);
    } else {
      setMore((data?.length || 0) > PAGE);
      setProducts((data || []).slice(0, PAGE) as Product[]);
    }
    setLoading(false);
  }, [category, search, currency, sort, page, onlySaved, saved]);
  useEffect(() => {
    if (view === "market") void loadProducts();
  }, [loadProducts, view]);
  const loadMine = useCallback(async () => {
    if (!user) return;
    const id = ++fetchId.current;
    setLoading(true);
    setLoadError("");
    let q = market()
      .from("luvai_products")
      .select("*,artisan:luvai_artisans(*)")
      .eq("artisan_id", user.id)
      .order("created_at", { ascending: false });
    if (studioTab !== "All") q = q.eq("status", studioTab.toLowerCase());
    const { data, error } = await q.range(page * PAGE, page * PAGE + PAGE);
    if (id !== fetchId.current) return;
    if (error) setLoadError(humanError(error));
    else {
      setMyProducts((data || []).slice(0, PAGE) as Product[]);
      setMore((data?.length || 0) > PAGE);
    }
    setLoading(false);
  }, [user, studioTab, page]);
  useEffect(() => {
    if (view === "studio" && user) void loadMine();
  }, [view, user, loadMine]);
  const loadMakers = useCallback(async () => {
    const id = ++fetchId.current;
    setLoading(true);
    setLoadError("");
    let q = market()
      .from("luvai_artisans")
      .select("*")
      .order("created_at", { ascending: false });
    if (search) q = q.ilike("shop_name", `%${search.replace(/[%_\\]/g, "")}%`);
    const { data, error } = await q.range(page * PAGE, page * PAGE + PAGE);
    if (id !== fetchId.current) return;
    if (error) setLoadError(humanError(error));
    else {
      setMakers((data || []).slice(0, PAGE) as Artisan[]);
      setMore((data?.length || 0) > PAGE);
    }
    setLoading(false);
  }, [page, search]);
  useEffect(() => {
    if (view === "makers") void loadMakers();
  }, [view, loadMakers]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const piece = params.get("piece"),
      shop = params.get("shop");
    if (piece && /^[a-f0-9-]{36}$/i.test(piece))
      market()
        .from("luvai_products")
        .select("*,artisan:luvai_artisans(*)")
        .eq("id", piece)
        .in("status", ["published", "sold"])
        .maybeSingle()
        .then(({ data, error }) => {
          if (data) setSelected(data as Product);
          else
            toast(
              error ? humanError(error) : "This piece is no longer available.",
            );
        });
    else if (shop)
      market()
        .from("luvai_artisans")
        .select("*")
        .eq("slug", shop)
        .maybeSingle()
        .then(({ data }) => {
          if (data) showMaker(data as Artisan);
        });
  }, []);
  useEffect(() => {
    if (!selectedMaker) return;
    let valid = true;
    setMakerPieces([]);
    market()
      .from("luvai_products")
      .select("*,artisan:luvai_artisans(*)")
      .eq("artisan_id", selectedMaker.id)
      .in("status", ["published", "sold"])
      .order("created_at", { ascending: false })
      .range(makerPage * 12, makerPage * 12 + 12)
      .then(({ data, error }) => {
        if (!valid) return;
        if (error) toast(humanError(error));
        else {
          setMakerPieces((data || []).slice(0, 12) as Product[]);
          setMakerMore((data?.length || 0) > 12);
        }
      });
    return () => {
      valid = false;
    };
  }, [selectedMaker, makerPage, toast]);
  function go(v: typeof view) {
    if (v !== view) fetchId.current++;
    setView(v);
    setPage(0);
    setMenu(false);
    setQuery("");
    setSearch("");
    setOnlySaved(false);
    setLoadError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function studio() {
    go("studio");
    if (!user) {
      setAuthMode("signup");
      open({ type: "auth" });
    }
  }
  function favorite(id: string) {
    setSaved((old) => {
      const next = old.includes(id)
        ? old.filter((x) => x !== id)
        : [...old, id];
      localStorage.setItem("luvai-market-saved", JSON.stringify(next));
      return next;
    });
  }
  function showPiece(p: Product) {
    returnFocus.current = document.activeElement as HTMLElement;
    setSelectedMaker(null);
    setModal(null);
    setSelected(p);
    setActivePhoto(0);
  }
  function showMaker(a: Artisan) {
    returnFocus.current = document.activeElement as HTMLElement;
    setSelected(null);
    setModal(null);
    setMakerPage(0);
    setSelectedMaker(a);
  }
  async function share(kind: "piece" | "shop", id: string) {
    const url = `${window.location.origin}/?${kind}=${encodeURIComponent(id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied.");
    } catch {
      open({ type: "link", url });
    }
  }
  async function authSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    setAuthMessage("");
    const f = new FormData(e.currentTarget),
      email = String(f.get("email")).trim(),
      password = String(f.get("password") || "");
    setAuthEmail(email);
    try {
      if (authMode === "signin") {
        const { error } = await market().auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setModal(null);
        go("studio");
        toast("Welcome back.");
      } else if (authMode === "reset") {
        const { error } = await market().auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setAuthMessage(
          "If this email has an account, a password reset email will arrive shortly. Follow its link, then return here.",
        );
      } else if (authMode === "verify") {
        const { error } = await market().auth.verifyOtp({
          email,
          token: String(f.get("token")),
          type: "signup",
        });
        if (error) throw error;
        setModal(null);
        go("studio");
        toast("Email confirmed. Set up your shop to start listing.");
      } else {
        const { data, error } = await market().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          setModal(null);
          go("studio");
          toast("Your account is ready. Let’s set up your shop.");
        } else
          setAuthMessage(
            "Check your email to confirm your account. After confirming, come back here and sign in. If your email includes a code, you can enter it here.",
          );
      }
    } catch (e) {
      setFormError(humanError(e));
    } finally {
      setBusy(false);
    }
  }
  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setFormError("");
    const f = new FormData(e.currentTarget);
    let phone = String(f.get("phone")).replace(/\D/g, "");
    if (phone.startsWith("0") && phone.length === 10)
      phone = "254" + phone.slice(1);
    const shop_name = String(f.get("shop_name")).trim();
    const row = {
      id: user.id,
      shop_name,
      maker_name: String(f.get("maker_name")).trim(),
      location: String(f.get("location")).trim(),
      bio: String(f.get("bio")).trim(),
      phone,
      slug:
        profile?.slug ||
        `${slugify(shop_name) || "maker"}-${user.id.slice(0, 8)}`,
    };
    try {
      if (!/^[1-9]\d{7,14}$/.test(phone))
        throw Error(
          "Enter a WhatsApp number with country code, e.g. +254712345678.",
        );
      const { data, error } = await market()
        .from("luvai_artisans")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      setProfile(data as Artisan);
      setModal(null);
      toast(
        profile ? "Shop updated." : "Your shop is ready. Add your first piece.",
      );
    } catch (e) {
      setFormError(humanError(e));
    } finally {
      setBusy(false);
    }
  }
  function editor(p: Product | null) {
    setEditing(p);
    setEditorId(p?.id || crypto.randomUUID());
    setEditImages(p?.images || []);
    setDescription(p?.description || "");
    setSelected(null);
    open({ type: "editor" });
  }
  async function upload(files: FileList | null) {
    if (!files || !user || !profile) return;
    setFormError("");
    if (files.length + editImages.length > 6) {
      setFormError(
        "You can add up to 6 photos per piece. There’s no limit on the number of pieces you list.",
      );
      return;
    }
    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const blob = await compressPhoto(file);
        const path = `${user.id}/${editorId}/${crypto.randomUUID()}.webp`;
        const { error } = await market()
          .storage.from("luvai-products")
          .upload(path, blob, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });
        if (error) throw error;
        added.push(path);
      }
    } catch (e) {
      setFormError(humanError(e));
    } finally {
      setEditImages((old) => [...old, ...added]);
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !profile) return;
    setBusy(true);
    setFormError("");
    const f = new FormData(e.currentTarget),
      status = String(
        (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ||
          "published",
      );
    try {
      if (!editImages.length)
        throw Error("Add at least one clear photo of your piece.");
      const amount = Number(f.get("price"));
      if (!Number.isFinite(amount) || amount <= 0)
        throw Error("Enter a valid price above zero.");
      const row = {
        id: editorId,
        artisan_id: user.id,
        title: String(f.get("title")).trim(),
        description: description.trim(),
        category: String(f.get("category")),
        price_minor: Math.round(amount * 100),
        currency: String(f.get("currency")),
        materials: String(f.get("materials")).trim(),
        dimensions: String(f.get("dimensions")).trim(),
        images: editImages,
        status,
        made_to_order: f.get("made_to_order") === "on",
        updated_at: new Date().toISOString(),
      };
      const { error } = await market()
        .from("luvai_products")
        .upsert(row, { onConflict: "id" });
      if (error) throw error;
      setModal(null);
      setStudioTab("All");
      setPage(0);
      toast(
        status === "draft"
          ? "Draft saved. Only you can see it."
          : "Your piece is live on the marketplace.",
      );
      void loadMine();
    } catch (e) {
      setFormError(humanError(e));
    } finally {
      setBusy(false);
    }
  }
  async function updateStatus(p: Product, status: Product["status"]) {
    setBusy(true);
    try {
      const { error } = await market()
        .from("luvai_products")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", p.id)
        .eq("artisan_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      toast(
        status === "archived"
          ? "Listing archived. You can restore it from your studio."
          : status === "sold"
            ? "Marked as sold."
            : "Listing published.",
      );
      setSelected(null);
      void loadMine();
    } catch (e) {
      toast(humanError(e));
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      const { error } = await market().auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      go("market");
      toast("Signed out.");
    } catch (e) {
      toast(humanError(e));
    } finally {
      setBusy(false);
    }
  }
  const shown = view === "studio" ? myProducts : products;
  return (
    <>
      <div className="topline">
        A home for African craft. A place for the people who make it.
      </div>
      <header className="header">
        <button
          className="brand"
          onClick={() => go("market")}
          aria-label="Luvai Africa home"
        >
          <img
            className="brand-mark"
            src="/logo-mark.svg"
            alt=""
            width="36"
            height="36"
          />
          Luvai<span>AFRICA</span>
          <span className="brand-dot">·</span>
        </button>
        <nav
          className={menu ? "nav mobile-open" : "nav"}
          aria-label="Main navigation"
        >
          <button
            className={view === "market" ? "active" : ""}
            onClick={() => go("market")}
          >
            The marketplace
          </button>
          <button
            className={view === "makers" ? "active" : ""}
            onClick={() => go("makers")}
          >
            Meet the makers
          </button>
          <button onClick={() => open({ type: "about" })}>Our approach</button>
        </nav>
        <div className="header-actions">
          <PwaInstall />
          <button
            className="icon-btn saved-btn"
            aria-label="Saved pieces"
            onClick={() => {
              go("market");
              setOnlySaved(true);
            }}
          >
            <Heart size={19} fill={onlySaved ? "currentColor" : "none"} />
            {saved.length > 0 && <span>{saved.length}</span>}
          </button>
          <button className="button primary header-sell" onClick={studio}>
            {profile ? "My studio" : "Start selling"} <ArrowUpRight size={15} />
          </button>
          <button
            className="icon-btn hamburger"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>
      <main>
        {view === "market" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <h1>
                  Your culture.
                  <br />
                  <em>Your heritage.</em>
                </h1>
                <p className="hero-delivery">Brought directly to you.</p>
                <div className="hero-actions">
                  <a href="#pieces" className="button primary">
                    Browse the marketplace <ArrowRight size={17} />
                  </a>
                  <button className="quiet-link" onClick={studio}>
                    I’m a maker <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="hero-caption">
                  <span className="caption-line" /> A direct connection between
                  you and the maker.
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="art-label">THE BEAUTY IS IN THE MAKING</div>
                <div className="art-form">
                  <div className="art-circle" />
                  <Vessel />
                </div>
                <div className="art-note">
                  <span>01 / A CONSIDERED BEGINNING</span>
                  <p>
                    Every piece starts
                    <br />
                    with a pair of hands.
                  </p>
                </div>
                <span className="art-edge">LU VAI AFRICA · EST. 2026</span>
              </div>
            </section>
            <div className="values-strip">
              <span>
                <Store size={17} /> Independent makers
              </span>
              <span>
                <MessageCircle size={17} /> Talk directly to the artisan
              </span>
              <span>
                <Leaf size={17} /> Made to be kept
              </span>
            </div>
          </>
        )}
        {view === "makers" && (
          <section className="page-intro">
            <span className="eyebrow">THE PEOPLE BEHIND THE PIECES</span>
            <h1>
              Meet the <em>makers.</em>
            </h1>
            <p>Independent shops. Personal stories. Work made with care.</p>
          </section>
        )}
        {view === "studio" && (
          <section className="page-intro studio-intro">
            <div>
              <span className="eyebrow">YOUR OWN CORNER OF LU VAI</span>
              <h1>
                {profile ? profile.shop_name : "Your craft belongs here."}
              </h1>
              <p>
                {profile
                  ? "Make, photograph, share. We’ll keep your shop in one place."
                  : "Create a shop and list as many pieces as you make."}
              </p>
            </div>
            {user && (
              <button className="quiet-link" disabled={busy} onClick={signOut}>
                Sign out <LogOut size={15} />
              </button>
            )}
          </section>
        )}
        {view === "studio" && !authReady ? (
          <div className="loading">
            <Loader2 className="spin" /> Loading your studio…
          </div>
        ) : view === "studio" && !user ? (
          <section className="onboarding">
            <Vessel small />
            <h2>
              A small shop.
              <br />A wider world.
            </h2>
            <p>
              Create an account, introduce your craft and upload your first
              piece. No listing limit, and no need to own a website.
            </p>
            <button
              className="button primary"
              onClick={() => {
                setAuthMode("signup");
                open({ type: "auth" });
              }}
            >
              Create your account <ArrowRight size={16} />
            </button>
            <button
              className="quiet-link"
              onClick={() => {
                setAuthMode("signin");
                open({ type: "auth" });
              }}
            >
              Already a maker here? Sign in
            </button>
          </section>
        ) : view === "studio" && user && !profile ? (
          <section className="profile-onboard">
            <div className="onboard-note">
              <span className="step">01 / YOUR SHOP</span>
              <h2>
                Let’s put a name
                <br />
                to your craft.
              </h2>
              <p>
                Just a few details to get started. Your shop name, location,
                story and WhatsApp number will appear on your public shop page.
              </p>
              <ul>
                <li>
                  <Check size={15} /> Unlimited product listings
                </li>
                <li>
                  <Check size={15} /> Your own shareable shop link
                </li>
                <li>
                  <Check size={15} /> Enquiries straight to WhatsApp
                </li>
              </ul>
            </div>
            <ProfileForm
              profile={null}
              busy={busy}
              error={formError}
              onSubmit={saveProfile}
            />
          </section>
        ) : (
          <section id="pieces" className="market-section">
            {view === "studio" && profile ? (
              <>
                <div className="studio-tools">
                  <div>
                    <span className="shop-initial">
                      {profile.shop_name.slice(0, 1)}
                    </span>
                    <div>
                      <strong>{profile.shop_name}</strong>
                      <span>
                        <MapPin size={12} />
                        {profile.location}
                      </span>
                    </div>
                  </div>
                  <div className="studio-buttons">
                    <button
                      className="button outline"
                      onClick={() => open({ type: "profile" })}
                    >
                      <Pencil size={14} /> Edit shop
                    </button>
                    <button
                      className="button outline"
                      onClick={() => share("shop", profile.slug)}
                    >
                      <Copy size={14} /> Shop link
                    </button>
                    <button
                      className="button primary"
                      onClick={() => editor(null)}
                    >
                      <Plus size={16} /> Add a piece
                    </button>
                  </div>
                </div>
                <div className="studio-tabs">
                  {["All", "Published", "Draft", "Sold", "Archived"].map(
                    (t) => (
                      <button
                        className={studioTab === t ? "active" : ""}
                        key={t}
                        onClick={() => {
                          setStudioTab(t);
                          setPage(0);
                        }}
                      >
                        {t}
                      </button>
                    ),
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="section-head">
                  <div>
                    <span className="eyebrow">
                      {view === "makers"
                        ? "A COMMUNITY, GROWING ONE MAKER AT A TIME"
                        : "THE MARKETPLACE"}
                    </span>
                    <h2>
                      {view === "makers"
                        ? "Find your next favourite maker."
                        : onlySaved
                          ? "Your saved pieces."
                          : "Find a piece that feels like you."}
                    </h2>
                  </div>
                  {view === "market" && (
                    <button className="quiet-link" onClick={studio}>
                      Bring your work here <Plus size={16} />
                    </button>
                  )}
                </div>
                <div className="search-row">
                  <div className="search-input">
                    <Search size={18} />
                    <input
                      aria-label={
                        view === "makers" ? "Search makers" : "Search pieces"
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={
                        view === "makers"
                          ? "Search for a shop…"
                          : "Search for something handmade…"
                      }
                    />
                    {query && (
                      <button
                        className="icon-btn"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {view === "market" && (
                    <>
                      <button
                        className={`button outline filters-button ${filters ? "pressed" : ""}`}
                        aria-expanded={filters}
                        onClick={() => setFilters(!filters)}
                      >
                        <SlidersHorizontal size={16} /> Filters
                      </button>
                      <select
                        aria-label="Sort pieces"
                        value={sort}
                        onChange={(e) => {
                          setSort(e.target.value);
                          setPage(0);
                        }}
                      >
                        <option value="newest">Newest first</option>
                        <option
                          value="price-low"
                          disabled={currency === "All currencies"}
                        >
                          Price: low to high
                        </option>
                        <option
                          value="price-high"
                          disabled={currency === "All currencies"}
                        >
                          Price: high to low
                        </option>
                      </select>
                    </>
                  )}
                </div>
                {view === "market" && (
                  <>
                    <div className="categories">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          className={category === c ? "selected" : ""}
                          onClick={() => {
                            setCategory(c);
                            setPage(0);
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {filters && (
                      <div className="filter-panel">
                        <label>
                          Currency
                          <select
                            value={currency}
                            onChange={(e) => {
                              setCurrency(e.target.value);
                              setSort("newest");
                              setPage(0);
                            }}
                          >
                            <option>All currencies</option>
                            <option>KES</option>
                            <option>USD</option>
                          </select>
                        </label>
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={onlySaved}
                            onChange={(e) => {
                              setOnlySaved(e.target.checked);
                              setPage(0);
                            }}
                          />{" "}
                          Only saved pieces
                        </label>
                        <button
                          className="quiet-link"
                          onClick={() => {
                            setCategory("All pieces");
                            setCurrency("All currencies");
                            setOnlySaved(false);
                            setSort("newest");
                            setQuery("");
                            setPage(0);
                          }}
                        >
                          Reset filters
                        </button>
                        <small>Choose a currency to compare prices.</small>
                      </div>
                    )}
                    {onlySaved && (
                      <div className="saved-banner">
                        <Heart size={15} /> Showing your saved pieces{" "}
                        <button
                          onClick={() => {
                            setOnlySaved(false);
                            setPage(0);
                          }}
                        >
                          Show everything <X size={13} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {loadError ? (
              <div className="state-card error-state">
                <p>{loadError}</p>
                <button
                  className="button outline"
                  onClick={() =>
                    view === "studio"
                      ? loadMine()
                      : view === "makers"
                        ? loadMakers()
                        : loadProducts()
                  }
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="loading" role="status">
                <Loader2 className="spin" size={20} /> Loading the marketplace…
              </div>
            ) : view === "makers" ? (
              makers.length ? (
                <div className="makers-grid">
                  {makers.map((a) => (
                    <button
                      key={a.id}
                      className="maker-card"
                      onClick={() => showMaker(a)}
                    >
                      <span className="maker-monogram">
                        {a.shop_name.slice(0, 1)}
                      </span>
                      <h3>{a.shop_name}</h3>
                      <span className="location">
                        <MapPin size={12} />
                        {a.location}
                      </span>
                      <p>{a.bio}</p>
                      <span className="maker-card-link">
                        Visit shop <ArrowUpRight size={16} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="state-card">
                  <Store size={36} strokeWidth={1} />
                  <h3>
                    {search
                      ? "No makers found."
                      : "The first shops are on their way."}
                  </h3>
                  <p>
                    {search
                      ? "Try another shop name."
                      : "Be one of the makers who shape this community from the beginning."}
                  </p>
                  <button className="button primary" onClick={studio}>
                    Open your shop <ArrowRight size={15} />
                  </button>
                </div>
              )
            ) : shown.length ? (
              <div className="products-grid">
                {shown.map((p) => (
                  <article className="product-card" key={p.id}>
                    <div className="product-image">
                      <button
                        className="photo-button"
                        onClick={() => showPiece(p)}
                        aria-label={`View ${p.title}`}
                      >
                        <img
                          src={photo(p.images[0])}
                          alt={p.title}
                          loading="lazy"
                        />
                      </button>
                      <button
                        className="save-piece"
                        aria-label={`${saved.includes(p.id) ? "Unsave" : "Save"} ${p.title}`}
                        aria-pressed={saved.includes(p.id)}
                        onClick={() => favorite(p.id)}
                      >
                        <Heart
                          size={18}
                          fill={saved.includes(p.id) ? "currentColor" : "none"}
                        />
                      </button>
                      {view === "studio" && (
                        <span className={`status ${p.status}`}>{p.status}</span>
                      )}
                      {p.made_to_order && (
                        <span className="made-label">Made to order</span>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="product-category">{p.category}</div>
                      <button
                        className="product-title"
                        onClick={() => showPiece(p)}
                      >
                        {p.title}
                      </button>
                      <p className="product-description">{p.description}</p>
                      <div className="product-bottom">
                        <button
                          className="by-maker"
                          onClick={() => p.artisan && showMaker(p.artisan)}
                        >
                          By {p.artisan?.shop_name || profile?.shop_name}
                        </button>
                        <strong>{price(p)}</strong>
                      </div>
                      {view === "studio" && (
                        <div className="card-actions">
                          <button onClick={() => editor(p)}>
                            <Pencil size={13} /> Edit
                          </button>
                          {p.status === "published" ? (
                            <button
                              disabled={busy}
                              onClick={() => updateStatus(p, "sold")}
                            >
                              Mark sold
                            </button>
                          ) : (
                            <button
                              disabled={busy}
                              onClick={() => updateStatus(p, "published")}
                            >
                              Publish
                            </button>
                          )}
                          {p.status !== "archived" && (
                            <button
                              disabled={busy}
                              onClick={() => updateStatus(p, "archived")}
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="state-card">
                <Vessel small />
                <span className="eyebrow">
                  {view === "studio"
                    ? "YOUR NEXT PIECE STARTS HERE"
                    : onlySaved
                      ? "A COLLECTION OF YOUR OWN"
                      : search || category !== "All pieces"
                        ? "KEEP EXPLORING"
                        : "A NEW MARKETPLACE, TAKING SHAPE"}
                </span>
                <h3>
                  {view === "studio"
                    ? studioTab === "All"
                      ? "Your shop is ready for its first piece."
                      : `No ${studioTab.toLowerCase()} pieces yet.`
                    : onlySaved
                      ? "Keep the pieces you love close."
                      : search || category !== "All pieces"
                        ? "Nothing here just yet."
                        : "The shelves are ready. The makers come next."}
                </h3>
                <p>
                  {view === "studio"
                    ? "Add a few clear photos, a price and a short story. List one piece or a hundred—there’s no listing cap."
                    : onlySaved
                      ? "Tap the heart on a product to find it here later on this device."
                      : search || category !== "All pieces"
                        ? "Try another search or category."
                        : "This space is reserved for real work from real artisans. If you make something, we’d love to see it here."}
                </p>
                <button
                  className="button primary"
                  onClick={() =>
                    view === "studio"
                      ? editor(null)
                      : onlySaved
                        ? setOnlySaved(false)
                        : search || category !== "All pieces"
                          ? (setCategory("All pieces"), setQuery(""))
                          : studio()
                  }
                >
                  {view === "studio"
                    ? "Add a piece"
                    : onlySaved
                      ? "Explore the marketplace"
                      : search || category !== "All pieces"
                        ? "Clear search & filters"
                        : "Be one of our first makers"}{" "}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            {!loading && !loadError && (page > 0 || more) && (
              <div className="pagination">
                <button
                  className="button outline"
                  disabled={page === 0}
                  onClick={() => {
                    setPage(page - 1);
                    document.getElementById("pieces")?.scrollIntoView();
                  }}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <span>Page {page + 1}</span>
                <button
                  className="button outline"
                  disabled={!more}
                  onClick={() => {
                    setPage(page + 1);
                    document.getElementById("pieces")?.scrollIntoView();
                  }}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}
          </section>
        )}
        {view !== "studio" && (
          <section className="maker-invitation">
            <div>
              <span className="eyebrow">FOR THE HANDS BEHIND THE WORK</span>
              <h2>
                You make it.
                <br />
                <em>Make it yours here.</em>
              </h2>
            </div>
            <div>
              <p>
                Your own shop, as many listings as you need, and a little space
                to tell the story behind each piece.
              </p>
              <button className="button primary" onClick={studio}>
                Open your shop <ArrowUpRight size={16} />
              </button>
              <small>
                No listing fees at launch. You keep control of your stock and
                delivery.
              </small>
            </div>
          </section>
        )}
      </main>
      <footer>
        <div className="footer-main">
          <button className="brand" onClick={() => go("market")}>
            <img
              className="brand-mark"
              src="/logo-mark.svg"
              alt=""
              width="36"
              height="36"
            />
            Luvai<span>AFRICA</span>
            <span className="brand-dot">·</span>
          </button>
          <p>
            A place for things made with care.
            <br />
            And for the people who make them.
          </p>
          <div>
            <button onClick={() => go("market")}>Marketplace</button>
            <button onClick={() => go("makers")}>The makers</button>
            <button onClick={studio}>Your studio</button>
          </div>
          <div>
            <button onClick={() => open({ type: "help" })}>How it works</button>
            <button onClick={() => open({ type: "privacy" })}>
              Privacy & care
            </button>
            <button onClick={() => open({ type: "about" })}>
              About Luvai Africa
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Luvai Africa</span>
          <span>Rooted in Africa. Made for connection.</span>
        </div>
      </footer>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {notice}
          <button
            className="icon-btn"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {active && (
        <div className="overlay" onClick={close}>
          <div
            ref={dialogRef}
            className={`dialog ${selected ? "piece-dialog" : selectedMaker ? "shop-dialog" : modal?.type === "editor" ? "editor-dialog" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="dialog-close icon-btn"
              aria-label="Close dialog"
              onClick={close}
              disabled={busy || uploading}
            >
              <X size={22} />
            </button>
            {selected ? (
              <>
                <div className="piece-gallery">
                  <img
                    src={photo(
                      selected.images[activePhoto] || selected.images[0],
                    )}
                    alt={`${selected.title}, photo ${activePhoto + 1}`}
                  />
                  {selected.images.length > 1 && (
                    <div className="photo-thumbs">
                      {selected.images.map((path, i) => (
                        <button
                          className={activePhoto === i ? "active" : ""}
                          key={path}
                          onClick={() => setActivePhoto(i)}
                          aria-label={`View photo ${i + 1}`}
                        >
                          <img src={photo(path)} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="piece-detail">
                  <span className="eyebrow">{selected.category}</span>
                  <h2 id="dialog-title">{selected.title}</h2>
                  <div className="detail-price">{price(selected)}</div>
                  {selected.status === "sold" ? (
                    <span className="availability sold">
                      <Check size={14} /> Sold
                    </span>
                  ) : (
                    <span className="availability">
                      <span className="tiny-dot" />
                      {selected.made_to_order
                        ? "Made to order"
                        : "Available from the maker"}
                    </span>
                  )}
                  <p className="piece-story">{selected.description}</p>
                  {(selected.materials || selected.dimensions) && (
                    <dl>
                      {selected.materials && (
                        <>
                          <dt>Materials</dt>
                          <dd>{selected.materials}</dd>
                        </>
                      )}
                      {selected.dimensions && (
                        <>
                          <dt>Dimensions</dt>
                          <dd>{selected.dimensions}</dd>
                        </>
                      )}
                    </dl>
                  )}
                  <button
                    className="detail-maker"
                    onClick={() =>
                      selected.artisan && showMaker(selected.artisan)
                    }
                  >
                    <span className="shop-initial">
                      {selected.artisan?.shop_name.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{selected.artisan?.shop_name}</strong>
                      <small>
                        <MapPin size={12} />
                        {selected.artisan?.location}
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                  {selected.artisan && selected.status === "published" && (
                    <a
                      className="button primary full"
                      href={whatsapp(selected)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={18} /> Ask the maker on WhatsApp{" "}
                      <ArrowUpRight size={16} />
                    </a>
                  )}
                  <small className="contact-note">
                    Agree on availability, payment and delivery directly with
                    the maker. Luvai does not take payment for this listing.
                  </small>
                  <div className="detail-actions">
                    <button onClick={() => favorite(selected.id)}>
                      <Heart
                        size={16}
                        fill={
                          saved.includes(selected.id) ? "currentColor" : "none"
                        }
                      />{" "}
                      {saved.includes(selected.id) ? "Saved" : "Save piece"}
                    </button>
                    <button onClick={() => share("piece", selected.id)}>
                      <Copy size={15} /> Share
                    </button>
                    <button
                      onClick={() => {
                        const id = selected.id;
                        setSelected(null);
                        if (!user) {
                          setAuthMode("signin");
                          open({ type: "auth" });
                          toast("Please sign in to report a listing.");
                        } else open({ type: "report", id });
                      }}
                    >
                      <Flag size={14} /> Report
                    </button>
                  </div>
                  {selected.artisan_id === user?.id && (
                    <button
                      className="button outline full"
                      onClick={() => editor(selected)}
                    >
                      <Pencil size={15} /> Edit your listing
                    </button>
                  )}
                </div>
              </>
            ) : selectedMaker ? (
              <>
                <div className="shop-heading">
                  <span className="maker-monogram">
                    {selectedMaker.shop_name.slice(0, 1)}
                  </span>
                  <span className="eyebrow">MEET THE MAKER</span>
                  <h2 id="dialog-title">{selectedMaker.shop_name}</h2>
                  <p className="location">
                    <MapPin size={13} />
                    {selectedMaker.location}{" "}
                    <span>· By {selectedMaker.maker_name}</span>
                  </p>
                  <p>{selectedMaker.bio}</p>
                  <div>
                    <a
                      className="button primary"
                      href={`https://wa.me/${selectedMaker.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={16} /> Contact the maker
                    </a>
                    <button
                      className="button outline"
                      onClick={() => share("shop", selectedMaker.slug)}
                    >
                      <Copy size={15} /> Share shop
                    </button>
                  </div>
                </div>
                <h3 className="shop-section-title">From this maker</h3>
                {makerPieces.length ? (
                  <div className="shop-pieces">
                    {makerPieces.map((p) => (
                      <button key={p.id} onClick={() => showPiece(p)}>
                        <img src={photo(p.images[0])} alt={p.title} />
                        <strong>{p.title}</strong>
                        <span>
                          {p.status === "sold" ? "Sold · " : ""}
                          {price(p)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="shop-no-pieces">
                    This maker is getting their first pieces ready. Check back
                    soon.
                  </p>
                )}
                {(makerPage > 0 || makerMore) && (
                  <div className="pagination">
                    <button
                      disabled={makerPage === 0}
                      onClick={() => setMakerPage(makerPage - 1)}
                    >
                      Previous
                    </button>
                    <span>Page {makerPage + 1}</span>
                    <button
                      disabled={!makerMore}
                      onClick={() => setMakerPage(makerPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : modal?.type === "auth" ? (
              <>
                <span className="eyebrow">YOUR LU VAI ACCOUNT</span>
                <h2 id="dialog-title">
                  {authMode === "signin"
                    ? "Welcome back."
                    : authMode === "reset"
                      ? "Forgot your password?"
                      : authMode === "verify"
                        ? "Confirm your email."
                        : "A place for your craft."}
                </h2>
                <p className="dialog-intro">
                  {authMode === "signup"
                    ? "Create an account. Then set up your shop and start adding your work."
                    : authMode === "reset"
                      ? "We’ll send instructions to your email address."
                      : "Sign in to manage your shop and listings."}
                </p>
                {["signin", "signup"].includes(authMode) && (
                  <div className="auth-tabs">
                    <button
                      className={authMode === "signup" ? "active" : ""}
                      onClick={() => {
                        setAuthMode("signup");
                        setFormError("");
                        setAuthMessage("");
                      }}
                    >
                      Create account
                    </button>
                    <button
                      className={authMode === "signin" ? "active" : ""}
                      onClick={() => {
                        setAuthMode("signin");
                        setFormError("");
                        setAuthMessage("");
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                )}
                <form onSubmit={authSubmit}>
                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      defaultValue={authEmail}
                    />
                  </label>
                  {["signin", "signup"].includes(authMode) && (
                    <label>
                      Password
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={authMode === "signup" ? 8 : 1}
                        maxLength={128}
                        autoComplete={
                          authMode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                      />
                      {authMode === "signup" && (
                        <small>
                          At least 8 characters. Use a password you don’t use
                          elsewhere.
                        </small>
                      )}
                    </label>
                  )}
                  {authMode === "verify" && (
                    <label>
                      Code from your confirmation email
                      <input
                        name="token"
                        required
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        minLength={6}
                        maxLength={12}
                      />
                    </label>
                  )}
                  {formError && (
                    <p className="form-error" role="alert">
                      {formError}
                    </p>
                  )}
                  {authMessage && (
                    <div className="form-success" role="status">
                      {authMessage}
                    </div>
                  )}
                  <button className="button primary full" disabled={busy}>
                    {busy ? (
                      <Loader2 className="spin" size={17} />
                    ) : authMode === "signin" ? (
                      "Sign in"
                    ) : authMode === "reset" ? (
                      "Send reset email"
                    ) : authMode === "verify" ? (
                      "Confirm email"
                    ) : (
                      "Create account"
                    )}
                    <ArrowRight size={16} />
                  </button>
                </form>
                <div className="auth-links">
                  <button
                    onClick={() => {
                      setAuthMode(authMode === "reset" ? "signin" : "reset");
                      setFormError("");
                      setAuthMessage("");
                    }}
                  >
                    {authMode === "reset"
                      ? "Back to sign in"
                      : "Forgot your password?"}
                  </button>
                  {authMode === "signup" && authMessage && (
                    <button
                      onClick={() => {
                        setAuthMode("verify");
                        setAuthMessage("");
                        setFormError("");
                      }}
                    >
                      Enter an email code
                    </button>
                  )}
                  {authMode === "verify" && (
                    <button onClick={() => setAuthMode("signin")}>
                      Already confirmed? Sign in
                    </button>
                  )}
                </div>
                <small className="privacy-note">
                  Your login email stays private. You choose the shop details
                  buyers can see.
                </small>
              </>
            ) : modal?.type === "profile" ? (
              <>
                <span className="eyebrow">YOUR SHOP</span>
                <h2 id="dialog-title">Make it personal.</h2>
                <p className="dialog-intro">
                  Your story and contact details help buyers get to know you.
                </p>
                <ProfileForm
                  profile={profile}
                  busy={busy}
                  error={formError}
                  onSubmit={saveProfile}
                />
              </>
            ) : modal?.type === "editor" ? (
              <>
                <span className="eyebrow">
                  YOUR STUDIO / {editing ? "EDIT PIECE" : "NEW PIECE"}
                </span>
                <h2 id="dialog-title">
                  {editing
                    ? "Give it a little care."
                    : "What have you been making?"}
                </h2>
                <p className="dialog-intro">
                  A few good photos and a short, honest description are all you
                  need.
                </p>
                <form onSubmit={saveProduct} key={editorId}>
                  <fieldset disabled={busy || uploading}>
                    <label className="label">
                      Photos{" "}
                      <span>
                        {editImages.length}/6 · First photo is the cover
                      </span>
                    </label>
                    <div className="upload-grid">
                      {editImages.map((path, i) => (
                        <div className="uploaded-photo" key={path}>
                          <img
                            src={photo(path)}
                            alt={`Product photo ${i + 1}`}
                          />
                          <button
                            type="button"
                            aria-label={`Remove photo ${i + 1}`}
                            onClick={() =>
                              setEditImages(
                                editImages.filter((x) => x !== path),
                              )
                            }
                          >
                            <X size={14} />
                          </button>
                          {i > 0 && (
                            <button
                              type="button"
                              className="make-cover"
                              onClick={() =>
                                setEditImages([
                                  path,
                                  ...editImages.filter((x) => x !== path),
                                ])
                              }
                            >
                              Make cover
                            </button>
                          )}
                          {i === 0 && <span>Cover</span>}
                        </div>
                      ))}
                      {editImages.length < 6 && (
                        <button
                          type="button"
                          className="upload-button"
                          onClick={() => fileRef.current?.click()}
                        >
                          <ImagePlus size={25} />
                          <span>Add photos</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => upload(e.target.files)}
                    />
                    <small className="field-note">
                      JPG, PNG or WebP. We resize photos for faster loading.
                      Upload photos you own.
                    </small>
                    {uploading && (
                      <p className="upload-status">
                        <Loader2 size={15} className="spin" /> Preparing and
                        uploading your photos…
                      </p>
                    )}
                    <label>
                      Piece name
                      <input
                        name="title"
                        required
                        minLength={3}
                        maxLength={100}
                        defaultValue={editing?.title}
                        placeholder="e.g. Handwoven sisal basket"
                      />
                    </label>
                    <div className="form-row">
                      <label>
                        Category
                        <select
                          name="category"
                          defaultValue={editing?.category || ""}
                          required
                        >
                          <option value="" disabled>
                            Select a category
                          </option>
                          {CATEGORIES.slice(1).map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Currency
                        <select
                          name="currency"
                          defaultValue={editing?.currency || "KES"}
                        >
                          <option>KES</option>
                          <option>USD</option>
                        </select>
                      </label>
                      <label>
                        Price
                        <input
                          name="price"
                          type="number"
                          min="0.01"
                          max="100000000"
                          step="0.01"
                          required
                          defaultValue={
                            editing ? editing.price_minor / 100 : ""
                          }
                          placeholder="0.00"
                        />
                      </label>
                    </div>
                    <label>
                      A little about this piece
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        minLength={20}
                        maxLength={600}
                        rows={4}
                        placeholder="What is it? What is it made from? What inspired you to make it?"
                      />
                      <span className="char-count">
                        {description.length}/600
                      </span>
                    </label>
                    <div className="form-row">
                      <label>
                        Materials <span className="optional">optional</span>
                        <input
                          name="materials"
                          maxLength={120}
                          defaultValue={editing?.materials}
                          placeholder="e.g. Sisal, natural dyes"
                        />
                      </label>
                      <label>
                        Dimensions <span className="optional">optional</span>
                        <input
                          name="dimensions"
                          maxLength={120}
                          defaultValue={editing?.dimensions}
                          placeholder="e.g. 30 cm high × 25 cm wide"
                        />
                      </label>
                    </div>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        name="made_to_order"
                        defaultChecked={editing?.made_to_order}
                      />{" "}
                      This piece is made to order
                    </label>
                  </fieldset>
                  {formError && (
                    <p className="form-error" role="alert">
                      {formError}
                    </p>
                  )}
                  <div className="editor-submit">
                    <button
                      className="button outline"
                      type="submit"
                      value="draft"
                      disabled={busy || uploading}
                    >
                      Save draft
                    </button>
                    <button
                      className="button primary"
                      type="submit"
                      value="published"
                      disabled={busy || uploading}
                    >
                      {busy ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <Check size={16} />
                      )}{" "}
                      {editing ? "Save & publish" : "Publish piece"}
                    </button>
                  </div>
                  <small className="privacy-note">
                    Publishing makes your photos, description and shop contact
                    details visible to buyers.
                  </small>
                </form>
              </>
            ) : modal?.type === "password" ? (
              <>
                <h2 id="dialog-title">Choose a new password.</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setFormError("");
                    const f = new FormData(e.currentTarget);
                    const { error } = await market().auth.updateUser({
                      password: String(f.get("password")),
                    });
                    setBusy(false);
                    if (error) setFormError(humanError(error));
                    else {
                      setModal(null);
                      setRecovery(false);
                      toast("Password updated.");
                    }
                  }}
                >
                  <label>
                    New password
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      maxLength={128}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                  {formError && (
                    <p role="alert" className="form-error">
                      {formError}
                    </p>
                  )}
                  <button disabled={busy} className="button primary full">
                    Update password
                  </button>
                </form>
              </>
            ) : modal?.type === "report" ? (
              <>
                <span className="eyebrow">LOOKING AFTER THE MARKETPLACE</span>
                <h2 id="dialog-title">Report this listing.</h2>
                <p className="dialog-intro">
                  Tell us what needs attention. Reports are private and do not
                  automatically remove a listing.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    setBusy(true);
                    const f = new FormData(e.currentTarget);
                    const { error } = await market()
                      .from("luvai_reports")
                      .insert({
                        product_id: modal.id,
                        reporter_id: user.id,
                        reason: String(f.get("reason")),
                      });
                    setBusy(false);
                    if (error) setFormError(humanError(error));
                    else {
                      setModal(null);
                      toast("Report received for review.");
                    }
                  }}
                >
                  <label>
                    What’s wrong?
                    <textarea
                      name="reason"
                      minLength={10}
                      maxLength={1000}
                      required
                      rows={4}
                    />
                  </label>
                  {formError && (
                    <p className="form-error" role="alert">
                      {formError}
                    </p>
                  )}
                  <button disabled={busy} className="button primary full">
                    Send report
                  </button>
                </form>
              </>
            ) : modal?.type === "link" ? (
              <>
                <h2 id="dialog-title">Share this link.</h2>
                <input
                  readOnly
                  value={modal.url}
                  aria-label="Shareable link"
                  onFocus={(e) => e.target.select()}
                />
              </>
            ) : (
              <>
                <span className="eyebrow">LU VAI AFRICA</span>
                <h2 id="dialog-title">
                  {modal?.type === "privacy"
                    ? "Privacy & care."
                    : modal?.type === "help"
                      ? "A few simple steps."
                      : "Good work deserves to be found."}
                </h2>
                {modal?.type === "privacy" ? (
                  <div className="prose">
                    <p>
                      We use your email to manage your account. Your shop name,
                      maker name, location, biography, WhatsApp number and
                      published listings are public. Never add your home address
                      or sensitive personal details to a listing.
                    </p>
                    <p>
                      Accounts, listings and photos are stored with Supabase.
                      Saved favourites stay on your current device. Archived
                      listings leave the marketplace but remain in your studio
                      so you can restore them.
                    </p>
                    <p>
                      You can edit your public details and archive your listings
                      at any time. A listing report is visible only to its
                      sender and the marketplace operator.
                    </p>
                  </div>
                ) : modal?.type === "help" ? (
                  <div className="prose">
                    <h3>For buyers</h3>
                    <p>
                      Browse the marketplace and save pieces you like. Open a
                      listing to read its story, see more photos and contact the
                      artisan on WhatsApp. Confirm the price, availability,
                      payment method and delivery before paying.
                    </p>
                    <h3>For makers</h3>
                    <p>
                      Create an account, confirm your email and set up your
                      shop. Upload a piece with photos, a price and a short
                      description. Publish it when it’s ready. You can edit,
                      save drafts, mark pieces sold and archive them from your
                      studio.
                    </p>
                    <h3>Keeping it clear</h3>
                    <p>
                      There is no listing cap and no listing fee at launch.
                      Makers manage stock, payments, delivery and returns
                      directly. Luvai does not currently process purchases or
                      offer payment protection.
                    </p>
                  </div>
                ) : (
                  <div className="prose">
                    <p>
                      Luvai Africa is a marketplace for African art and handmade
                      objects. It gives independent makers a place to show their
                      work, tell a little of its story and connect directly with
                      people who appreciate it.
                    </p>
                    <p>
                      We’re starting simply: real shops, real photos and the
                      details that help you decide. No invented reviews, no
                      assumed provenance, and no claims that every piece has
                      been independently authenticated.
                    </p>
                    <p>
                      If you make work with care, there’s a place for you here.
                    </p>
                    <button
                      className="button primary"
                      onClick={() => {
                        setModal(null);
                        studio();
                      }}
                    >
                      Open your shop <ArrowUpRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
function ProfileForm({
  profile,
  busy,
  error,
  onSubmit,
}: {
  profile: Artisan | null;
  busy: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="profile-form" onSubmit={onSubmit}>
      <label>
        Shop name
        <input
          name="shop_name"
          required
          minLength={2}
          maxLength={70}
          defaultValue={profile?.shop_name}
          placeholder="The name on your door"
        />
      </label>
      <label>
        Your name
        <input
          name="maker_name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={profile?.maker_name}
          autoComplete="name"
          placeholder="Who’s behind the work?"
        />
      </label>
      <label>
        Town & country
        <input
          name="location"
          required
          minLength={2}
          maxLength={100}
          defaultValue={profile?.location}
          placeholder="e.g. Nairobi, Kenya"
        />
        <small>
          A general location is enough. Keep your home address private.
        </small>
      </label>
      <label>
        WhatsApp number
        <input
          name="phone"
          type="tel"
          required
          maxLength={20}
          defaultValue={profile?.phone ? `+${profile.phone}` : ""}
          placeholder="+254712345678"
          autoComplete="tel"
        />
        <small>
          Buyers will use this number to ask about your work. It will be public.
        </small>
      </label>
      <label>
        A little about your craft
        <textarea
          name="bio"
          rows={4}
          required
          minLength={20}
          maxLength={600}
          defaultValue={profile?.bio}
          placeholder="What do you make? Where did you learn? What makes your work yours?"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary full" disabled={busy}>
        {busy ? (
          <Loader2 size={16} className="spin" />
        ) : profile ? (
          "Save shop details"
        ) : (
          "Create my shop"
        )}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
export default function Home() {
  return (
    <Suspense fallback={<div className="loading">Opening Luvai Africa…</div>}>
      <App />
    </Suspense>
  );
}
