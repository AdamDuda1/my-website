import {readFile} from "node:fs/promises";
import {resolve} from "node:path";

const projectsPath = resolve(process.cwd(), "data", "projects.json");
const socialLinksPath = resolve(process.cwd(), "data", "social-links.json");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function run() {
    const raw = await readFile(projectsPath, "utf8");
    const projects = JSON.parse(raw);
  const socialRaw = await readFile(socialLinksPath, "utf8");
  const socialLinks = JSON.parse(socialRaw);

    assert(Array.isArray(projects), "data/projects.json must be an array.");
    assert(projects.length > 0, "Add at least one project.");

    const ids = new Set();

    projects.forEach((project, index) => {
        const label = `Project #${index + 1}`;

        assert(typeof project.id === "string" && project.id.length > 0, `${label}: missing valid id.`);
        assert(!ids.has(project.id), `${label}: id '${project.id}' must be unique.`);
        ids.add(project.id);

        assert(typeof project.name === "string" && project.name.length > 0, `${label}: missing name.`);
        assert(
            typeof project.description === "string" && project.description.length > 0,
            `${label}: missing description.`
        );
        assert(typeof project.icon === "string" && project.icon.length > 0, `${label}: missing icon.`);
        assert(/\.png($|\?)/i.test(project.icon), `${label}: icon must be a .png path or URL.`);
        assert(typeof project.url === "string" && /^https?:\/\//.test(project.url), `${label}: url must be http/https.`);
        if (project.repo !== undefined) {
            assert(typeof project.repo === "string" && /^https?:\/\//.test(project.repo), `${label}: repo must be http/https.`);
        }

    });

      assert(Array.isArray(socialLinks), "data/social-links.json must be an array.");
      const socialIds = new Set();

      socialLinks.forEach((link, index) => {
        const label = `Social link #${index + 1}`;

        assert(typeof link.id === "string" && link.id.length > 0, `${label}: missing id.`);
        assert(!socialIds.has(link.id), `${label}: id '${link.id}' must be unique.`);
        socialIds.add(link.id);
        assert(typeof link.label === "string" && link.label.length > 0, `${label}: missing label.`);
        const hasIconSrc = typeof link.iconSrc === "string" && link.iconSrc.length > 0;
        const hasIconText = typeof link.iconText === "string" && link.iconText.length > 0;
        const hasLegacyIcon = typeof link.icon === "string" && link.icon.length > 0;
        assert(hasIconSrc || hasIconText || hasLegacyIcon, `${label}: provide iconSrc or iconText.`);
        if (hasIconSrc) {
            assert(/^https?:\/\//.test(link.iconSrc), `${label}: iconSrc must be http/https.`);
        }
        assert(typeof link.url === "string" && /^https?:\/\//.test(link.url), `${label}: url must be http/https.`);
        if (link.enabled !== undefined) {
          assert(typeof link.enabled === "boolean", `${label}: enabled must be boolean if provided.`);
        }
      });

      console.log(`OK: validated ${projects.length} project(s) and ${socialLinks.length} social link(s).`);
}

run().catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
});

