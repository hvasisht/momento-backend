/* ── API helpers ── */
async function apiGetToken() {
  var user = firebase.auth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function apiGet(path) {
  var token = await apiGetToken();
  var res = await fetch(API_BASE + path, {
    headers: { "Authorization": "Bearer " + token }
  });
  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

async function apiPost(path, body) {
  var token = await apiGetToken();
  var res = await fetch(API_BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

async function apiPatch(path, body) {
  var token = await apiGetToken();
  var res = await fetch(API_BASE + path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

async function apiDelete(path) {
  var token = await apiGetToken();
  var res = await fetch(API_BASE + path, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });
  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}
