--
-- PostgreSQL database dump
--

\restrict hZ6Qjfp2ZJYvJRfoKnT3gYB1gFAO3PDMJvBtoMfRv41wIozZJM3CHDFv90UJ95X

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Task" DROP CONSTRAINT IF EXISTS "Task_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public."Dependency" DROP CONSTRAINT IF EXISTS "Dependency_toTaskId_fkey";
ALTER TABLE IF EXISTS ONLY public."Dependency" DROP CONSTRAINT IF EXISTS "Dependency_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public."Dependency" DROP CONSTRAINT IF EXISTS "Dependency_fromTaskId_fkey";
DROP INDEX IF EXISTS public."Task_projectId_idx";
DROP INDEX IF EXISTS public."Dependency_projectId_idx";
DROP INDEX IF EXISTS public."Dependency_fromTaskId_toTaskId_key";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Task" DROP CONSTRAINT IF EXISTS "Task_pkey";
ALTER TABLE IF EXISTS ONLY public."SiteSettings" DROP CONSTRAINT IF EXISTS "SiteSettings_pkey";
ALTER TABLE IF EXISTS ONLY public."Project" DROP CONSTRAINT IF EXISTS "Project_pkey";
ALTER TABLE IF EXISTS ONLY public."Dependency" DROP CONSTRAINT IF EXISTS "Dependency_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."Task";
DROP TABLE IF EXISTS public."SiteSettings";
DROP TABLE IF EXISTS public."Project";
DROP TABLE IF EXISTS public."Dependency";
DROP TYPE IF EXISTS public."DependencyType";
--
-- Name: DependencyType; Type: TYPE; Schema: public; Owner: planificador
--

CREATE TYPE public."DependencyType" AS ENUM (
    'FS',
    'SS',
    'FF'
);


ALTER TYPE public."DependencyType" OWNER TO planificador;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Dependency; Type: TABLE; Schema: public; Owner: planificador
--

CREATE TABLE public."Dependency" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    "fromTaskId" text NOT NULL,
    "toTaskId" text NOT NULL,
    "lagDays" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type public."DependencyType" DEFAULT 'FS'::public."DependencyType" NOT NULL
);


ALTER TABLE public."Dependency" OWNER TO planificador;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: planificador
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    "eventDate" timestamp(3) without time zone NOT NULL,
    timezone text DEFAULT 'Europe/Madrid'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Project" OWNER TO planificador;

--
-- Name: SiteSettings; Type: TABLE; Schema: public; Owner: planificador
--

CREATE TABLE public."SiteSettings" (
    id text NOT NULL,
    title text NOT NULL,
    tagline text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SiteSettings" OWNER TO planificador;

--
-- Name: Task; Type: TABLE; Schema: public; Owner: planificador
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    title text NOT NULL,
    "durationDays" integer NOT NULL,
    "earliestStart" timestamp(3) without time zone,
    "earliestFinish" timestamp(3) without time zone,
    "latestStart" timestamp(3) without time zone,
    "latestFinish" timestamp(3) without time zone,
    "slackDays" double precision DEFAULT 0 NOT NULL,
    "isCritical" boolean DEFAULT false NOT NULL,
    "fixedStart" timestamp(3) without time zone,
    "positionX" double precision DEFAULT 0 NOT NULL,
    "positionY" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "progressPct" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Task" OWNER TO planificador;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: planificador
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO planificador;

--
-- Data for Name: Dependency; Type: TABLE DATA; Schema: public; Owner: planificador
--

COPY public."Dependency" (id, "projectId", "fromTaskId", "toTaskId", "lagDays", "createdAt", type) FROM stdin;
cmssw2zz8000mpm1pjod8ttlw	cmssw2zy70000pm1pch6ldvib	cmssw2zyc0002pm1pa3gxlv6c	cmssw2zyf0004pm1pj8r2v7cv	0	2026-08-14 11:54:16.101	FS
cmssw2zzc000opm1pvj18fru1	cmssw2zy70000pm1pch6ldvib	cmssw2zyc0002pm1pa3gxlv6c	cmssw2zyi0006pm1pjenpa81h	0	2026-08-14 11:54:16.104	FS
cmssw2zze000qpm1pws43yvcu	cmssw2zy70000pm1pch6ldvib	cmssw2zyc0002pm1pa3gxlv6c	cmssw2zym0008pm1p4tdlogrs	0	2026-08-14 11:54:16.106	FS
cmssw2zzg000spm1pbhfoy99u	cmssw2zy70000pm1pch6ldvib	cmssw2zyf0004pm1pj8r2v7cv	cmssw2zyp000apm1pawal4evk	0	2026-08-14 11:54:16.109	FS
cmssw2zzj000upm1pawn3rtdx	cmssw2zy70000pm1pch6ldvib	cmssw2zym0008pm1p4tdlogrs	cmssw2zyp000apm1pawal4evk	0	2026-08-14 11:54:16.111	FS
cmssw2zzl000wpm1pvzbx88b6	cmssw2zy70000pm1pch6ldvib	cmssw2zym0008pm1p4tdlogrs	cmssw2zyv000epm1p80btq18v	0	2026-08-14 11:54:16.114	FS
cmssw2zzn000ypm1p7mv8tpr5	cmssw2zy70000pm1pch6ldvib	cmssw2zyi0006pm1pjenpa81h	cmssw2zz5000kpm1pwpjca558	0	2026-08-14 11:54:16.116	FS
cmssw2zzp0010pm1pzfshe61c	cmssw2zy70000pm1pch6ldvib	cmssw2zyp000apm1pawal4evk	cmssw2zys000cpm1pnn1jeqbt	0	2026-08-14 11:54:16.117	FS
cmssw2zzr0012pm1pud9vfj6x	cmssw2zy70000pm1pch6ldvib	cmssw2zys000cpm1pnn1jeqbt	cmssw2zz2000ipm1pbeqi2qxe	0	2026-08-14 11:54:16.119	FS
cmssw2zzt0014pm1phle6uhd0	cmssw2zy70000pm1pch6ldvib	cmssw2zyv000epm1p80btq18v	cmssw2zz2000ipm1pbeqi2qxe	0	2026-08-14 11:54:16.121	FS
cmssw2zzu0016pm1pvzt3n31t	cmssw2zy70000pm1pch6ldvib	cmssw2zyy000gpm1poo5ewvr1	cmssw2zz5000kpm1pwpjca558	0	2026-08-14 11:54:16.123	FS
cmssw2zzw0018pm1pjqy8wb0i	cmssw2zy70000pm1pch6ldvib	cmssw2zz2000ipm1pbeqi2qxe	cmssw2zz5000kpm1pwpjca558	0	2026-08-14 11:54:16.124	FS
cmssw2zzy001apm1puljpyllf	cmssw2zy70000pm1pch6ldvib	cmssw2zys000cpm1pnn1jeqbt	cmssw2zz5000kpm1pwpjca558	0	2026-08-14 11:54:16.126	FS
cmsswcuma0006pm8ll7fsizgs	cmsswbz1c0000pm8lsqj1k3hw	cmsswcelz0002pm8ll342uzg8	cmsswcs0f0004pm8liq0okg63	0	2026-08-14 12:01:55.715	FS
cmsswdtbl000epm8l7wqp3dbr	cmsswbz1c0000pm8lsqj1k3hw	cmsswcs0f0004pm8liq0okg63	cmsswdc310008pm8lrdtbvncb	0	2026-08-14 12:02:40.689	FS
cmsswduiq000gpm8l4e72ekh0	cmsswbz1c0000pm8lsqj1k3hw	cmsswcs0f0004pm8liq0okg63	cmsswdgyf000apm8lxua93at1	0	2026-08-14 12:02:42.243	FS
cmsswdw0b000ipm8lluyixwo8	cmsswbz1c0000pm8lsqj1k3hw	cmsswcs0f0004pm8liq0okg63	cmsswdphr000cpm8ll8d8plhn	0	2026-08-14 12:02:44.171	FS
cmsszll5m000zpm8l90iipf2g	cmsswbz1c0000pm8lsqj1k3hw	cmsswdc310008pm8lrdtbvncb	cmsswe4jm000kpm8lmbdtzmyd	0	2026-08-14 13:32:42.203	FS
cmstkju9j0005pm72h0x9443v	cmsswbz1c0000pm8lsqj1k3hw	cmsswe4jm000kpm8lmbdtzmyd	cmstkjepb0001pm72wfki769z	0	2026-08-14 23:19:12.631	FS
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: planificador
--

COPY public."Project" (id, name, "eventDate", timezone, "createdAt", "updatedAt") FROM stdin;
cmssw2zy70000pm1pch6ldvib	Boda Ana & Luis	2026-11-12 00:00:00	Europe/Madrid	2026-08-14 11:54:16.063	2026-08-14 11:54:16.063
cmsswbz1c0000pm8lsqj1k3hw	Aprender Inglés	2026-08-31 00:00:00	Europe/Madrid	2026-08-14 12:01:14.784	2026-08-14 12:01:14.784
cmssxxx96000npm8lf4d1xkcz	prueba	2026-08-21 00:00:00	Europe/Madrid	2026-08-14 12:46:18.522	2026-08-14 12:46:18.522
\.


--
-- Data for Name: SiteSettings; Type: TABLE DATA; Schema: public; Owner: planificador
--

COPY public."SiteSettings" (id, title, tagline, "updatedAt") FROM stdin;
default	Planificador de Eventos, Tareas y Proyectos	Traza la ruta hacia tu éxito...	2026-08-20 12:12:17.607
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: planificador
--

COPY public."Task" (id, "projectId", title, "durationDays", "earliestStart", "earliestFinish", "latestStart", "latestFinish", "slackDays", "isCritical", "fixedStart", "positionX", "positionY", "createdAt", "updatedAt", "progressPct") FROM stdin;
cmssw2zys000cpm1pnn1jeqbt	cmssw2zy70000pm1pch6ldvib	Prueba de sonido	1	2026-05-30 00:00:00	2026-05-31 00:00:00	2026-11-09 00:00:00	2026-11-10 00:00:00	163	f	\N	880	0	2026-08-14 11:54:16.084	2026-08-14 11:54:16.274	0
cmssw2zyv000epm1p80btq18v	cmssw2zy70000pm1pch6ldvib	Flores y centro de mesa	2	2026-05-25 00:00:00	2026-05-27 00:00:00	2026-11-08 00:00:00	2026-11-10 00:00:00	167	f	\N	660	160	2026-08-14 11:54:16.087	2026-08-14 11:54:16.274	0
cmssw2zyy000gpm1poo5ewvr1	cmssw2zy70000pm1pch6ldvib	Encargar tarta	3	2026-05-16 00:00:00	2026-05-19 00:00:00	2026-11-08 00:00:00	2026-11-11 00:00:00	176	f	\N	440	240	2026-08-14 11:54:16.091	2026-08-14 11:54:16.274	0
cmssw2zz2000ipm1pbeqi2qxe	cmssw2zy70000pm1pch6ldvib	Ensayo general	1	2026-05-31 00:00:00	2026-06-01 00:00:00	2026-11-10 00:00:00	2026-11-11 00:00:00	163	f	\N	880	120	2026-08-14 11:54:16.095	2026-08-14 11:54:16.274	0
cmssw2zz5000kpm1pwpjca558	cmssw2zy70000pm1pch6ldvib	Llegada de invitados	1	2026-06-01 00:00:00	2026-06-02 00:00:00	2026-11-11 00:00:00	2026-11-12 00:00:00	163	f	\N	1100	80	2026-08-14 11:54:16.098	2026-08-14 11:54:16.274	0
cmsswcs0f0004pm8liq0okg63	cmsswbz1c0000pm8lsqj1k3hw	Crear Plan de Estudio	3	2026-03-05 00:00:00	2026-03-08 00:00:00	2026-08-18 00:00:00	2026-08-21 00:00:00	166	f	\N	266	89	2026-08-14 12:01:52.336	2026-08-18 23:51:11.417	37
cmsswdc310008pm8lrdtbvncb	cmsswbz1c0000pm8lsqj1k3hw	Nivel I	4	2026-03-08 00:00:00	2026-03-12 00:00:00	2026-08-21 00:00:00	2026-08-25 00:00:00	166	f	\N	475	14.875	2026-08-14 12:02:18.349	2026-08-18 23:56:31.03	55
cmssw2zyc0002pm1pa3gxlv6c	cmssw2zy70000pm1pch6ldvib	Reservar venue	5	2026-05-16 00:00:00	2026-05-21 00:00:00	2026-10-26 00:00:00	2026-10-31 00:00:00	163	f	\N	0	80	2026-08-14 11:54:16.068	2026-08-18 23:56:44.593	26
cmsswdgyf000apm8lxua93at1	cmsswbz1c0000pm8lsqj1k3hw	Nivel II	4	2026-03-08 00:00:00	2026-03-12 00:00:00	2026-08-27 00:00:00	2026-08-31 00:00:00	172	f	\N	480	120	2026-08-14 12:02:24.664	2026-08-18 23:58:57.001	56
cmssxy9y9000ppm8lthr772qe	cmssxxx96000npm8lf4d1xkcz	inicio	1	2026-02-22 00:00:00	2026-02-23 00:00:00	2026-08-20 00:00:00	2026-08-21 00:00:00	179	f	\N	456	365	2026-08-14 12:46:34.978	2026-08-19 09:29:22.66	0
cmssw2zyf0004pm1pj8r2v7cv	cmssw2zy70000pm1pch6ldvib	Contratar cáterin	7	2026-05-21 00:00:00	2026-05-28 00:00:00	2026-10-31 00:00:00	2026-11-07 00:00:00	163	f	\N	220	0	2026-08-14 11:54:16.071	2026-08-14 11:54:16.274	0
cmssw2zyi0006pm1pjenpa81h	cmssw2zy70000pm1pch6ldvib	Enviar invitaciones	3	2026-05-21 00:00:00	2026-05-24 00:00:00	2026-11-08 00:00:00	2026-11-11 00:00:00	171	f	\N	220	160	2026-08-14 11:54:16.074	2026-08-14 11:54:16.274	0
cmssw2zym0008pm1p4tdlogrs	cmssw2zy70000pm1pch6ldvib	Definir decoración	4	2026-05-21 00:00:00	2026-05-25 00:00:00	2026-11-03 00:00:00	2026-11-07 00:00:00	166	f	\N	440	80	2026-08-14 11:54:16.078	2026-08-14 11:54:16.274	0
cmssw2zyp000apm1pawal4evk	cmssw2zy70000pm1pch6ldvib	Montar escenario	2	2026-05-28 00:00:00	2026-05-30 00:00:00	2026-11-07 00:00:00	2026-11-09 00:00:00	163	f	\N	660	0	2026-08-14 11:54:16.081	2026-08-14 11:54:16.274	0
cmstkjepb0001pm72wfki769z	cmsswbz1c0000pm8lsqj1k3hw	Listening	4	2026-03-14 00:00:00	2026-03-18 00:00:00	2026-08-27 00:00:00	2026-08-31 00:00:00	166	f	\N	722	122	2026-08-14 23:18:52.463	2026-08-14 23:19:12.644	0
cmsswdphr000cpm8ll8d8plhn	cmsswbz1c0000pm8lsqj1k3hw	Nivel III	4	2026-03-08 00:00:00	2026-03-12 00:00:00	2026-08-27 00:00:00	2026-08-31 00:00:00	172	f	\N	482	210	2026-08-14 12:02:35.727	2026-08-14 23:19:12.644	0
cmsswcelz0002pm8ll342uzg8	cmsswbz1c0000pm8lsqj1k3hw	Verificar Nivel Actual	1	2026-03-04 00:00:00	2026-03-05 00:00:00	2026-08-17 00:00:00	2026-08-18 00:00:00	166	f	\N	39	106	2026-08-14 12:01:34.968	2026-08-14 23:19:12.644	0
cmsswe4jm000kpm8lmbdtzmyd	cmsswbz1c0000pm8lsqj1k3hw	Gramática	2	2026-03-12 00:00:00	2026-03-14 00:00:00	2026-08-25 00:00:00	2026-08-27 00:00:00	166	f	\N	720	47	2026-08-14 12:02:55.234	2026-08-14 23:19:12.644	0
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: planificador
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ff88e421-7b4d-49bc-a738-86ce7dde2d0f	084a56875a97107468dc71387136d4865a09bd49cd555e23d9f25209e92ef6b3	2026-08-14 09:31:58.080233+00	20250813120000_init	\N	\N	2026-08-14 09:31:58.010503+00	1
48cc165e-672d-42ba-a05e-32372a8b16f6	8c8ed08089dcba8072b7c1f8bb11329c9a9e758c2efcb18486e722c921f5bc8c	2026-08-14 23:17:39.142203+00	20260814120000_site_settings	\N	\N	2026-08-14 23:17:39.089778+00	1
3367287f-f704-45c9-beb9-b0c57fb43dfe	605c90b17b7afb8ffa5aec0ee500b3dea9441e5948403c1e9b9843724653def4	2026-08-18 23:35:34.407973+00	20260818230000_drop_delay_scenario	\N	\N	2026-08-18 23:35:34.359335+00	1
60d373d4-9ace-4e7e-9daa-15ff20bb46b6	fe23af1037c4006935153d410d9d4b2f68095f2225e084d29755f3b770bad901	2026-08-18 23:35:34.431995+00	20260818233000_dep_type_progress	\N	\N	2026-08-18 23:35:34.410852+00	1
\.


--
-- Name: Dependency Dependency_pkey; Type: CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public."Dependency"
    ADD CONSTRAINT "Dependency_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: SiteSettings SiteSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public."SiteSettings"
    ADD CONSTRAINT "SiteSettings_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Dependency_fromTaskId_toTaskId_key; Type: INDEX; Schema: public; Owner: planificador
--

CREATE UNIQUE INDEX "Dependency_fromTaskId_toTaskId_key" ON public."Dependency" USING btree ("fromTaskId", "toTaskId");


--
-- Name: Dependency_projectId_idx; Type: INDEX; Schema: public; Owner: planificador
--

CREATE INDEX "Dependency_projectId_idx" ON public."Dependency" USING btree ("projectId");


--
-- Name: Task_projectId_idx; Type: INDEX; Schema: public; Owner: planificador
--

CREATE INDEX "Task_projectId_idx" ON public."Task" USING btree ("projectId");


--
-- Name: Dependency Dependency_fromTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public."Dependency"
    ADD CONSTRAINT "Dependency_fromTaskId_fkey" FOREIGN KEY ("fromTaskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dependency Dependency_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public."Dependency"
    ADD CONSTRAINT "Dependency_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dependency Dependency_toTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public."Dependency"
    ADD CONSTRAINT "Dependency_toTaskId_fkey" FOREIGN KEY ("toTaskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: planificador
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict hZ6Qjfp2ZJYvJRfoKnT3gYB1gFAO3PDMJvBtoMfRv41wIozZJM3CHDFv90UJ95X

