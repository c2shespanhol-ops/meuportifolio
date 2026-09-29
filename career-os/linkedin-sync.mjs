#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CURRENT = path.join(ROOT, "career-os", "linkedin-profile.json");
const INBOX = path.join(ROOT, "career-os", "inbox", "linkedin-profile.json");

const normalize = (value) => {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => [k, normalize(v)]));
  }
  if (typeof value === "string") return value.replace(/\r\n/g, "\n").trim();
  return value;
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const keyFor = (item) => {
  if (!item || typeof item !== "object") return JSON.stringify(item);
  return item.id || item.url || item.company || item.school || item.name || JSON.stringify(item);
};

function diffValues(oldValue, newValue, location = "") {
  const changes = [];
  if (Array.isArray(oldValue) || Array.isArray(newValue)) {
    const oldMap = new Map((oldValue || []).map(x => [keyFor(x), x]));
    const newMap = new Map((newValue || []).map(x => [keyFor(x), x]));
    for (const [key, item] of newMap) {
      if (!oldMap.has(key)) changes.push({type:"added", path:location, value:item});
      else if (JSON.stringify(normalize(oldMap.get(key))) !== JSON.stringify(normalize(item))) changes.push({type:"changed", path:location, value:item});
    }
    for (const [key, item] of oldMap) {
      if (!newMap.has(key)) changes.push({type:"removed", path:location, value:item});
    }
    return changes;
  }
  if (oldValue && typeof oldValue === "object" && newValue && typeof newValue === "object") {
    const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
    for (const key of keys) changes.push(...diffValues(oldValue[key], newValue[key], location ? location + "." + key : key));
    return changes;
  }
  if (JSON.stringify(normalize(oldValue)) !== JSON.stringify(normalize(newValue))) {
    return [{type:"changed", path:location, from:oldValue ?? null, to:newValue ?? null}];
  }
  return changes;
}

function validate(snapshot) {
  if (!snapshot?.source || snapshot.source.type !== "linkedin-profile-snapshot") throw new Error("Snapshot inválido: source.type deve ser linkedin-profile-snapshot.");
  if (!snapshot.source.profileUrl?.includes("linkedin.com/in/")) throw new Error("Snapshot inválido: profileUrl não parece ser um perfil LinkedIn.");
  if (!snapshot.profile?.name) throw new Error("Snapshot inválido: profile.name é obrigatório.");
}

if (!fs.existsSync(INBOX)) {
  console.error("Nenhum snapshot novo encontrado em career-os/inbox/linkedin-profile.json.");
  process.exit(2);
}

const incoming = readJson(INBOX);
validate(incoming);

const current = fs.existsSync(CURRENT) ? readJson(CURRENT) : null;
const changes = current ? diffValues(current.profile, incoming.profile, "profile") : [{type:"initial", path:"profile", value:incoming.profile}];

console.log(JSON.stringify({
  source: incoming.source.profileUrl,
  capturedAt: incoming.capturedAt,
  status: current ? (changes.length ? "review_required" : "no_changes") : "initial_snapshot",
  changeCount: changes.length,
  changes
}, null, 2));

if (changes.length && process.env.APPLY === "true") {
  fs.mkdirSync(path.dirname(CURRENT), {recursive:true});
  fs.writeFileSync(CURRENT, JSON.stringify(incoming, null, 2) + "\n");
  fs.rmSync(INBOX);
  console.log("Snapshot aplicado ao Career OS.");
}
