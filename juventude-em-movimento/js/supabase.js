(function () {
  const cfg = window.APP_CONFIG || {};
  const ready = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient);
  window.communityDb = ready ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  window.hasSharedBoard = ready;

  window.dbLoad = async function (table, orderColumn = "created_at") {
    if (!window.communityDb) return null;
    const publicColumns = {
      community_notes: "id, author, content, color, created_at",
      community_posts: "id, author, title, content, likes, created_at"
    };
    const columns = publicColumns[table] || "*";
    const { data, error } = await window.communityDb.from(table).select(columns).order(orderColumn, { ascending: false }).limit(80);
    if (error) throw error;
    return data || [];
  };

  window.dbInsert = async function (table, payload) {
    if (!window.communityDb) return null;
    const { data, error } = await window.communityDb.from(table).insert(payload).select().single();
    if (error) throw error;
    return data;
  };

  window.dbDeleteNote = async function (noteId, ownerToken) {
    if (!window.communityDb) return false;
    const { data, error } = await window.communityDb.rpc("delete_community_note", {
      note_id: noteId,
      note_owner_token: ownerToken
    });
    if (error) throw error;
    return data === true;
  };

  window.dbDeletePost = async function (postId, ownerToken) {
    if (!window.communityDb) return false;
    const { data, error } = await window.communityDb.rpc("delete_community_post", {
      post_id: postId,
      post_owner_token: ownerToken
    });
    if (error) throw error;
    return data === true;
  };

  window.dbLikePost = async function (postId) {
    if (!window.communityDb) return null;
    const { data, error } = await window.communityDb.rpc("like_community_post", { post_id: postId });
    if (error) throw error;
    return data;
  };
})();
