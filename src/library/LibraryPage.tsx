import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ADMIN_EMAIL, ASSET_BUCKET, supabase } from "../lib/supabase";
import "./library.css";

type MediaType = "book" | "film";
type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  creator: string;
  cast_members: string;
  release_date: string;
  genre: string;
  viewed_at: string;
  description: string;
  quote: string;
  reflection: string;
  cover_url: string;
  created_at: string;
};
type SceneImage = { id: string; item_id: string; image_url: string };

const blank = (type: MediaType): Omit<MediaItem, "id" | "created_at"> => ({
  type, title: "", creator: "", cast_members: "", release_date: "", genre: "",
  viewed_at: "", description: "", quote: "", reflection: "", cover_url: "",
});

function uploadPath(file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  return `${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

export default function LibraryPage() {
  const [tab, setTab] = useState<MediaType>("book");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [scenes, setScenes] = useState<SceneImage[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editing, setEditing] = useState<MediaItem | null | "new">(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isAdmin = session?.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const filtered = useMemo(() => items.filter((item) => item.type === tab), [items, tab]);

  async function loadData() {
    setLoading(true);
    const [{ data, error }, { data: sceneData }] = await Promise.all([
      supabase.from("media_items").select("*").order("created_at", { ascending: false }),
      supabase.from("scene_images").select("*").order("created_at", { ascending: true }),
    ]);
    if (error) setMessage("云端数据表尚未初始化，请先运行项目中的 Supabase 建表脚本。");
    else { setItems(data || []); setScenes(sceneData || []); setMessage(""); }
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  async function upload(file: File) {
    const path = uploadPath(file);
    const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(ASSET_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type")) as MediaType;
    const payload = {
      type,
      title: String(form.get("title") || ""), creator: String(form.get("creator") || ""),
      cast_members: String(form.get("cast_members") || ""), release_date: String(form.get("release_date") || "") || null,
      genre: String(form.get("genre") || ""), viewed_at: String(form.get("viewed_at") || "") || null,
      description: String(form.get("description") || ""), quote: String(form.get("quote") || ""),
      reflection: String(form.get("reflection") || ""), cover_url: editing === "new" ? "" : editing?.cover_url || "",
    };
    try {
      const cover = form.get("cover") as File;
      if (cover?.size) payload.cover_url = await upload(cover);
      const result = editing === "new"
        ? await supabase.from("media_items").insert(payload).select().single()
        : await supabase.from("media_items").update(payload).eq("id", editing!.id).select().single();
      if (result.error) throw result.error;
      const sceneFiles = form.getAll("scenes") as File[];
      if (type === "film" && sceneFiles.some((file) => file.size)) {
        const urls = await Promise.all(sceneFiles.filter((file) => file.size).map(upload));
        const { error } = await supabase.from("scene_images").insert(urls.map((image_url) => ({ item_id: result.data.id, image_url })));
        if (error) throw error;
      }
      setEditing(null); setSelected(result.data); await loadData();
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败"); }
  }

  async function removeItem(item: MediaItem) {
    if (!window.confirm(`确定删除《${item.title}》吗？`)) return;
    const { error } = await supabase.from("media_items").delete().eq("id", item.id);
    if (error) setMessage(error.message); else { setSelected(null); await loadData(); }
  }

  return (
    <main className="library-page">
      <header className="library-header">
        <a href="#/" className="library-brand">PUFF&apos;S LITTLE WORLD</a>
        <div className="library-actions">
          {isAdmin && <button onClick={() => setEditing("new")} className="library-button">＋ 添加记录</button>}
          <button onClick={() => isAdmin ? void supabase.auth.signOut() : setLoginOpen(true)} className="library-button subtle">{isAdmin ? "退出管理" : "管理登录"}</button>
        </div>
      </header>

      <section className="library-intro">
        <p>BOOKS & CINEMA</p><h1>书影记录</h1>
        <div className="library-tabs" role="tablist">
          <button className={tab === "book" ? "active" : ""} onClick={() => { setTab("book"); setSelected(null); }}>读书记录</button>
          <button className={tab === "film" ? "active" : ""} onClick={() => { setTab("film"); setSelected(null); }}>影视记录</button>
        </div>
      </section>

      {message && <p className="library-message">{message}</p>}
      {loading ? <div className="library-empty">正在读取云端记录…</div> : selected ? (
        <Detail item={selected} scenes={scenes.filter((scene) => scene.item_id === selected.id)} isAdmin={isAdmin} onBack={() => setSelected(null)} onEdit={() => setEditing(selected)} onDelete={() => void removeItem(selected)} />
      ) : filtered.length ? tab === "book" ? (
        <div className="bookcase">{filtered.map((item) => <button key={item.id} className="book-on-shelf" onClick={() => setSelected(item)}><span className="book-cover">{item.cover_url ? <img src={item.cover_url} alt={item.title} /> : <span>{item.title}</span>}</span><strong>{item.title}</strong></button>)}</div>
      ) : (
        <div className="clotheslines">{[0,1,2].map((row) => <div className="clothesline-row" key={row}>{filtered.filter((_item, index) => index % 3 === row).map((item) => <button key={item.id} className="hanging-film" onClick={() => setSelected(item)}><i /><span>{item.cover_url ? <img src={item.cover_url} alt={item.title} /> : item.title}</span><strong>{item.title}</strong></button>)}</div>)}</div>
      ) : <div className="library-empty">这里还没有{tab === "book" ? "书籍" : "影片"}记录。{isAdmin && " 点击右上角添加第一条记录。"}</div>}

      {editing && <Editor item={editing === "new" ? blank(tab) : editing} onClose={() => setEditing(null)} onSubmit={saveItem} />}
      {loginOpen && <Login onClose={() => setLoginOpen(false)} onMessage={setMessage} />}
    </main>
  );
}

function Detail({ item, scenes, isAdmin, onBack, onEdit, onDelete }: { item: MediaItem; scenes: SceneImage[]; isAdmin: boolean; onBack: () => void; onEdit: () => void; onDelete: () => void }) {
  return <section className="open-record">
    <button className="detail-back" onClick={onBack}>← 返回陈列</button>
    <div className="record-left">{item.cover_url && <img src={item.cover_url} alt={item.title} />}<h2>{item.title}</h2><dl>
      <dt>{item.type === "book" ? "作者" : "导演"}</dt><dd>{item.creator || "—"}</dd>
      {item.type === "film" && <><dt>主演</dt><dd>{item.cast_members || "—"}</dd><dt>上映日期</dt><dd>{item.release_date || "—"}</dd><dt>类型</dt><dd>{item.genre || "—"}</dd><dt>观影日期</dt><dd>{item.viewed_at || "—"}</dd></>}
    </dl>{item.description && <p className="record-description">{item.description}</p>}
      {isAdmin && <div className="record-admin"><button onClick={onEdit}>编辑</button><button onClick={onDelete}>删除</button></div>}
    </div>
    <div className="record-right"><article className="quote-panel"><span>经典语录</span><blockquote>{item.quote || "尚未记录"}</blockquote></article><article className="reflection-panel"><span>{item.type === "book" ? "读后感" : "观后感"}</span><p>{item.reflection || "尚未记录"}</p>{item.type === "film" && scenes.length > 0 && <div className="scene-gallery">{scenes.map((scene) => <img key={scene.id} src={scene.image_url} alt={`${item.title} 名场面`} />)}</div>}</article></div>
  </section>;
}

function Editor({ item, onClose, onSubmit }: { item: Omit<MediaItem, "id" | "created_at"> | MediaItem; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const film = item.type === "film";
  return <div className="library-modal"><form className="editor-card" onSubmit={onSubmit}><div className="editor-title"><h2>{"id" in item ? "编辑记录" : "添加记录"}</h2><button type="button" onClick={onClose}>×</button></div>
    <input type="hidden" name="type" value={item.type} /><label>封面图片<input name="cover" type="file" accept="image/*" /></label><label>{film ? "片名" : "书名"}<input name="title" required defaultValue={item.title} /></label><label>{film ? "导演" : "作者"}<input name="creator" defaultValue={item.creator} /></label>
    {film && <div className="editor-grid"><label>主演<input name="cast_members" defaultValue={item.cast_members} /></label><label>上映日期<input name="release_date" type="date" defaultValue={item.release_date || ""} /></label><label>类型<input name="genre" defaultValue={item.genre} /></label><label>观影日期<input name="viewed_at" type="date" defaultValue={item.viewed_at || ""} /></label></div>}
    <label>{film ? "影片简介" : "书籍简介"}<textarea name="description" rows={3} defaultValue={item.description} /></label><label>经典语录<textarea name="quote" rows={3} defaultValue={item.quote} /></label><label>{film ? "观后感" : "读后感"}<textarea name="reflection" rows={6} defaultValue={item.reflection} /></label>{film && <label>名场面图片（可多选）<input name="scenes" type="file" accept="image/*" multiple /></label>}
    <div className="editor-actions"><button type="button" onClick={onClose}>取消</button><button type="submit">保存记录</button></div></form></div>;
}

function Login({ onClose, onMessage }: { onClose: () => void; onMessage: (value: string) => void }) {
  async function login(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) }); if (error) onMessage(error.message); else onClose(); }
  return <div className="library-modal"><form className="login-card" onSubmit={login}><button type="button" onClick={onClose}>×</button><p>ADMIN ACCESS</p><h2>管理登录</h2><label>邮箱<input name="email" type="email" defaultValue={ADMIN_EMAIL} required /></label><label>密码<input name="password" type="password" required /></label><button type="submit">登录</button></form></div>;
}
