const grid = document.querySelector("#projects-grid");
const template = document.querySelector("#project-card-template");
const socialLinksRoot = document.querySelector("#social-links");
const socialTemplate = document.querySelector("#social-link-template");
const statusSection = document.querySelector("#status-section");
const statusTagTemplate = document.querySelector("#status-tag-template");
const randomProjectBtn = document.querySelector("#random-project-btn");
const projectsCount = document.querySelector("#projects-count");
const usefulLinksSection = document.querySelector("#useful-links-section");
const usefulLinksGrid = document.querySelector("#useful-links-grid");
const usefulLinkTemplate = document.querySelector("#useful-link-template");

let allProjects = [];

const STATUS_CONFIG = {
    pinned: { label: "★ Pinned", className: "badge-pinned", priority: 0 },
    "in-progress": { label: "▶ In Progress", className: "badge-in-progress", priority: 1 },
    abandoned: { label: "✕ Abandoned", className: "badge-abandoned", priority: 2 },
};

function createCard(project) {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".project-card");
    const projectLink = node.querySelector(".project-link");
    const repoLink = node.querySelector(".repo-link");
    const icon = node.querySelector(".icon");
    const title = node.querySelector("h3");
    const description = node.querySelector(".description");
    const cardTop = node.querySelector(".card-top");

    card.dataset.projectId = project.id;
    card.setAttribute("aria-label", `${project.name} card`);

    const statusCfg = STATUS_CONFIG[project.status];
    if (statusCfg) {
        card.classList.add(`status-${project.status}`);
        const badge = document.createElement("span");
        badge.className = `status-badge ${statusCfg.className}`;
        badge.textContent = statusCfg.label;
        cardTop.appendChild(badge);
    }

    projectLink.href = project.url;
    projectLink.setAttribute("aria-label", `${project.name} - open project`);

    if (project.repo) {
        repoLink.href = project.repo;
        repoLink.hidden = false;
        repoLink.setAttribute("aria-label", `${project.name} - open repository`);
    } else {
        repoLink.hidden = true;
    }

    title.textContent = project.name;
    icon.src = project.icon;
    icon.alt = `${project.name} icon`;
    description.textContent = project.description;

    return node;
}

function validateProject(project, index) {
    const required = ["name", "description", "icon", "url"];
    const missing = required.filter((key) => !project[key]);

    if (missing.length > 0) {
        throw new Error(`Project #${index + 1} is missing required fields: ${missing.join(", ")}`);
    }

    if (project.repo && !/^https?:\/\//.test(project.repo)) {
        throw new Error(`Project #${index + 1} has invalid repo URL.`);
    }
}

function renderList(projects) {
    const priority = (p) => (STATUS_CONFIG[p.status]?.priority ?? 99);
    const sorted = [...projects].sort((a, b) => priority(a) - priority(b));
    const fragment = document.createDocumentFragment();

    sorted.forEach((project, index) => {
        validateProject(project, index);
        fragment.appendChild(createCard(project));
    });

    grid.innerHTML = "";
    grid.appendChild(fragment);
}

function validateSocialLink(link, index) {
    const required = ["id", "label", "url"];
    const missing = required.filter((key) => !link[key]);

    if (missing.length > 0) {
        throw new Error(`Social link #${index + 1} is missing required fields: ${missing.join(", ")}`);
    }

    if (!/^https?:\/\//.test(link.url)) {
        throw new Error(`Social link #${index + 1} has invalid URL.`);
    }

    if (!link.iconSrc && !link.iconText && !link.icon) {
        throw new Error(`Social link #${index + 1} needs iconSrc or iconText.`);
    }
}

function createSocialLink(link) {
    const node = socialTemplate.content.cloneNode(true);
    const anchor = node.querySelector(".social-link");
    const icon = node.querySelector(".social-icon");
    const iconImage = node.querySelector(".social-icon-img");
    const iconText = node.querySelector(".social-icon-text");
    const label = node.querySelector(".social-label");
    const textFallback = link.iconText || link.icon || link.label.slice(0, 2).toUpperCase();

    anchor.href = link.url;
    anchor.setAttribute("aria-label", `Open ${link.label}`);
    iconText.textContent = textFallback;

    if (link.iconSrc) {
        icon.classList.add("has-image");
        iconImage.src = link.iconSrc;
        iconImage.addEventListener("error", () => {
            icon.classList.remove("has-image");
        }, { once: true });
    }

    label.textContent = link.label;

    return node;
}

function renderSocialLinks(links) {
    if (!socialLinksRoot || !socialTemplate) {
        return;
    }

    const enabled = links.filter((link) => link.enabled !== false);
    const fragment = document.createDocumentFragment();

    enabled.forEach((link, index) => {
        validateSocialLink(link, index);
        fragment.appendChild(createSocialLink(link));
    });

    socialLinksRoot.innerHTML = "";
    socialLinksRoot.appendChild(fragment);
}

function updateProjectsCount(total) {
    if (!projectsCount) {
        return;
    }

    projectsCount.textContent = `${total} projects ready to explore.`;
}

function renderStatus(data) {
    if (!statusSection || !statusTagTemplate) {
        return;
    }

    const infoEl = document.createElement("div");
    infoEl.className = "status-info";

    const labelEl = document.createElement("p");
    labelEl.className = "status-label";
    labelEl.textContent = "Current project in works";

    const currentEl = document.createElement("p");
    currentEl.className = "status-current";
    currentEl.textContent = data.currentProject || "—";

    const statusEl = document.createElement("p");
    const dot = document.createElement("span");
    dot.className = "status-dot";
    dot.setAttribute("aria-hidden", "true");
    statusEl.appendChild(dot);
    statusEl.appendChild(document.createTextNode(data.status || ""));

    const descEl = document.createElement("p");
    descEl.textContent = data.description || "";

    infoEl.appendChild(labelEl);
    infoEl.appendChild(currentEl);
    infoEl.appendChild(statusEl);
    infoEl.appendChild(descEl);

    const tagsEl = document.createElement("div");
    tagsEl.className = "status-tags";
    tagsEl.setAttribute("aria-label", "Tags");

    (data.tags || []).forEach((tag) => {
        const node = statusTagTemplate.content.cloneNode(true);
        node.querySelector(".status-tag").textContent = tag;
        tagsEl.appendChild(node);
    });

    statusSection.innerHTML = "";
    statusSection.appendChild(infoEl);
    statusSection.appendChild(tagsEl);
    statusSection.hidden = false;
}

function pickRandomProject() {
    if (allProjects.length === 0) {
        return;
    }

    const index = Math.floor(Math.random() * allProjects.length);
    const selected = allProjects[index];

    // Highlight the selected card to make the random action visible.
    grid.querySelectorAll(".project-card").forEach((card) => {
        card.classList.toggle("is-picked", card.dataset.projectId === selected.id);
    });

    window.open(selected.url, "_blank", "noopener,noreferrer");
}

function createUsefulLink(link) {
    const node = usefulLinkTemplate.content.cloneNode(true);
    const anchor = node.querySelector(".useful-link");
    const labelEl = node.querySelector(".useful-link-label");
    const descEl = node.querySelector(".useful-link-desc");

    anchor.href = link.url;
    anchor.setAttribute("aria-label", link.description ? `${link.label} — ${link.description}` : link.label);
    labelEl.textContent = link.label;
    if (link.description) {
        descEl.textContent = link.description;
    } else {
        descEl.hidden = true;
    }

    return node;
}

function renderUsefulLinks(links) {
    if (!usefulLinksSection || !usefulLinksGrid || !usefulLinkTemplate) {
        return;
    }

    const fragment = document.createDocumentFragment();
    links.forEach((link) => fragment.appendChild(createUsefulLink(link)));

    usefulLinksGrid.innerHTML = "";
    usefulLinksGrid.appendChild(fragment);
    usefulLinksSection.hidden = false;
}

async function renderProjects() {
    try {
        const socialResponse = await fetch("./data/social-links.json", {cache: "no-store"});
        if (socialResponse.ok) {
            const socialLinks = await socialResponse.json();
            if (Array.isArray(socialLinks)) {
                renderSocialLinks(socialLinks);
            }
        }

        const response = await fetch("./data/projects.json", {cache: "no-store"});
        if (!response.ok) {
            throw new Error(`Could not fetch projects: ${response.status}`);
        }

        const projects = await response.json();
        if (!Array.isArray(projects)) {
            throw new Error("Invalid format: expected an array of projects.");
        }

        allProjects = projects;
        renderList(allProjects);
        updateProjectsCount(allProjects.length);

        if (randomProjectBtn) {
            randomProjectBtn.addEventListener("click", pickRandomProject);
        }

        const statusResponse = await fetch("./data/status.json", {cache: "no-store"});
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            renderStatus(statusData);
        }

        const usefulLinksResponse = await fetch("./data/useful-links.json", {cache: "no-store"});
        if (usefulLinksResponse.ok) {
            const usefulLinks = await usefulLinksResponse.json();
            if (Array.isArray(usefulLinks)) {
                renderUsefulLinks(usefulLinks);
            }
        }
    } catch (error) {
        grid.innerHTML = `<p class=\"muted\">Failed to load projects. ${error.message}</p>`;
    }
}

renderProjects();

