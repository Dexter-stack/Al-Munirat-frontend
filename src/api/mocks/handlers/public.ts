import type { MockContext } from "@/api/mocks/context";
import { notFound, ok, okPaginated, paginate } from "@/api/mocks/envelope";
import {
  classLevels,
  courses,
  events,
  hajjUmrahAnnouncements,
  hajjUmrahFaqs,
  hajjUmrahPackages,
  publicSettings,
} from "@/api/mocks/db";
import type { MockRoute } from "@/api/mocks/router";

function textMatch(haystacks: (string | undefined)[], needle: string) {
  const q = needle.toLowerCase();
  return haystacks.some((h) => h?.toLowerCase().includes(q));
}

export const publicRoutes: MockRoute[] = [
  {
    method: "get",
    path: "/public/courses",
    handler: (ctx: MockContext) => {
      let list = courses.filter((c) => c.status === "published");
      const search = ctx.query.search as string | undefined;
      if (search) list = list.filter((c) => textMatch([c.name, c.arabic_name ?? undefined], search));
      const classId = ctx.query.class_id as string | undefined;
      if (classId) list = list.filter((c) => c.class_id === Number(classId));
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/public/courses/:slug",
    handler: (ctx: MockContext) => {
      const course = courses.find((c) => c.slug === ctx.params.slug && c.status === "published");
      if (!course) return notFound("Course");
      return ok(course);
    },
  },
  {
    // API_DOCUMENTATION.md §11: { settings, featured_courses } only —
    // no events/hajj-umrah sections, those modules don't exist on the
    // backend yet. Don't stub them here either.
    method: "get",
    path: "/public/home",
    handler: () => {
      const featured = courses.filter((c) => c.status === "published").slice(0, 6);
      return ok({ settings: publicSettings, featured_courses: featured });
    },
  },
  {
    method: "get",
    path: "/public/settings",
    handler: () => ok(publicSettings),
  },
  {
    // GET /public/contact — curated display info, distinct from the POST
    // route below (a lead-capture form submission with no real backend
    // endpoint yet).
    method: "get",
    path: "/public/contact",
    handler: () =>
      ok({
        email: publicSettings.contact_email,
        phone: publicSettings.contact_phone,
        address: publicSettings.contact_address,
        arabic_address: publicSettings.contact_address_arabic,
        social: {
          facebook: publicSettings.social_facebook,
          twitter: publicSettings.social_twitter,
          instagram: publicSettings.social_instagram,
          youtube: publicSettings.social_youtube,
          whatsapp: publicSettings.social_whatsapp,
        },
      }),
  },
  {
    method: "get",
    path: "/public/events",
    handler: (ctx: MockContext) => {
      let list = events.filter((e) => e.is_published);
      const search = ctx.query.search as string | undefined;
      if (search) list = list.filter((e) => textMatch([e.title, e.arabic_title], search));
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/public/events/:slug",
    handler: (ctx: MockContext) => {
      const event = events.find((e) => e.slug === ctx.params.slug && e.is_published);
      if (!event) return notFound("Event");
      return ok(event);
    },
  },
  {
    method: "get",
    path: "/public/hajj-umrah/packages",
    handler: (ctx: MockContext) => {
      let list = hajjUmrahPackages.filter((p) => p.is_published);
      const type = ctx.query.type as string | undefined;
      if (type) list = list.filter((p) => p.type === type);
      return ok(list);
    },
  },
  {
    method: "get",
    path: "/public/hajj-umrah/faqs",
    handler: () => ok(hajjUmrahFaqs),
  },
  {
    method: "get",
    path: "/public/hajj-umrah/announcements",
    handler: () => ok(hajjUmrahAnnouncements),
  },
  {
    method: "post",
    path: "/public/contact",
    handler: () => ok(null, "Thank you — we'll be in touch shortly."),
  },
  {
    method: "get",
    path: "/public/classes",
    handler: () => ok(classLevels.filter((c) => c.status === "active")),
  },
];
