// STEA Education - Phase 4 University & Career Hub Data
// Designed for high-fidelity Tanzanian academic counseling.

export const COURSES = [
  {
    id: "engineering",
    name: "Engineering (Muundo & Uhandisi)",
    overview: "Uhandisi unahusisha matumizi ya sayansi na hisabati kubuni, kujenga, na kudumisha miundombinu kama barabara, majengo, mifumo ya umeme, na mashine mbalimbali. Ni fani muhimu sana kwa maendeleo ya viwanda nchini Tanzania.",
    careers: ["Civil Engineer", "Electrical Engineer", "Mechanical Engineer", "Structural Consultant", "Project Manager"],
    salary: "TZS 1,200,000 - TZS 3,500,000 / mwezi (Wastani wa kuanzia)",
    skills: ["Hisabati (Maths)", "Physics (Fizikia)", "Logical Reasoning", "CAD/Technical Drawing", "Critical Thinking"],
    universities: ["UDSM (CoET)", "DIT", "MUST", "ATC", "Ardhi University"]
  },
  {
    id: "comp_science",
    name: "Computer Science (Sayansi ya Kompyuta)",
    overview: "Inajumuisha kusoma nadharia na matumizi ya mifumo ya kompyuta, algorithms, software development, na usalama wa data. Fani hii inakua kwa kasi ya kipekee kutokana na mapinduzi ya kidijitali nchini na duniani.",
    careers: ["Software Developer", "Web Engineer", "Database Administrator", "Systems Analyst", "IT Specialist"],
    salary: "TZS 1,500,000 - TZS 4,000,000 / mwezi",
    skills: ["Problem Solving", "Coding (Python, Java, JS)", "Database Management", "System Design"],
    universities: ["UDSM", "UDOM", "DIT", "IFM", "NM-AIST"]
  },
  {
    id: "medicine",
    name: "Medicine (Utabibu & Upasuaji - MD)",
    overview: "Kusomea MD kunakuandaa kuwa Daktari wa kutibu na kuzuia magonjwa ya binadamu. Ni kozi ya miaka 5 ya masomo ikifuatiwa na mwaka mmoja wa uzoefu (Internship). Ndiyo kozi yenye heshima na mahitaji makubwa zaidi nchini.",
    careers: ["Medical Doctor", "Surgeon", "Pediatrician", "Medical Researcher", "Health Administrator"],
    salary: "TZS 1,800,000 - TZS 4,500,000 / mwezi",
    skills: ["Biology & Chemistry", "Diagnostic Skills", "High Empathy", "Stress Tolerance", "Attention to Detail"],
    universities: ["MUHAS", "CUHAS (Bugando)", "KCMUCo (KCMC)", "UDSM (Mbeya College)", "UDOM"]
  },
  {
    id: "business",
    name: "Business Administration (Utawala wa Biashara)",
    overview: "Kozi hii inajenga stadi za kusimamia mashirika, masoko, rasilimali watu, na ujasiriamali. Huandaa viongozi na wasimamizi wa biashara ndogo na kubwa.",
    careers: ["Business Manager", "Marketing Executive", "HR Officer", "Entrepreneur", "Sales Manager"],
    salary: "TZS 800,000 - TZS 2,500,000 / mwezi",
    skills: ["Leadership", "Effective Communication", "Financial Management", "Negotiation", "Strategic Planning"],
    universities: ["Mzumbe University", "UDSM (UDBS)", "UDOM", "CBE", "TIA"]
  },
  {
    id: "law",
    name: "Law (Sheria - LLB)",
    overview: "Lengo kuu ni kusomea sheria za nchi na za kimataifa, jinsi ya kutetea haki, kuandika mikataba, na kusimamia taratibu za kisheria. Baada ya digrii, mwanafunzi lazima ahudhurie Law School of Tanzania ili kuwa Wakili kamili.",
    careers: ["Advocate (Wakili)", "State Attorney", "Legal Corporate Advisor", "Magistrate", "Compliance Analyst"],
    salary: "TZS 1,000,000 - TZS 3,500,000 / mwezi (Inakua sana ukifungua kampuni binafsi)",
    skills: ["Public Speaking", "Analytical Reading", "Research Capabilities", "Critical Argumentation", "Drafting"],
    universities: ["UDSM", "Mzumbe University", "Ruaha Catholic University (RUCU)", "St. Augustine (SAUT)", "Open University of Tanzania"]
  },
  {
    id: "education",
    name: "Education (Ualimu - B.Ed)",
    overview: "Hutengeneza walimu weledi kwa ajili ya shule za sekondari na vyuo. Wanafunzi huchagua masomo mawili ya kufundisha (Arts au Science). Ni sekta inayoajiri wahitimu wengi zaidi nchini.",
    careers: ["Secondary School Teacher", "Education Officer", "School Inspector", "Curriculum Developer", "Tutor"],
    salary: "TZS 550,000 - TZS 1,200,000 / mwezi",
    skills: ["Presentation Skills", "Patience", "Classroom Management", "Child Psychology", "Lesson Planning"],
    universities: ["DUCE", "MUCE", "UDSM", "UDOM", "St. John's University"]
  },
  {
    id: "agriculture",
    name: "Agriculture (Kilimo & Uzalishaji)",
    overview: "Kilimo ndio mhimili mkuu wa uchumi wa Tanzania. Kozi hii inafundisha teknolojia mpya za kilimo, usindikaji wa chakula, ufugaji wa kisasa, uchumi wa kilimo (Agribusiness) na jinsi ya kukabiliana na mabadiliko ya tabianchi.",
    careers: ["Agronomist", "Agribusiness Consultant", "Farm Manager", "Agricultural Researcher", "Food Quality Officer"],
    salary: "TZS 800,000 - TZS 2,200,000 / mwezi",
    skills: ["Biology & Chemistry", "Data Analysis", "Project Management", "Environmental Science"],
    universities: ["SUA (Sokoine University of Agriculture)", "UDOM", "UDSM"]
  },
  {
    id: "ict",
    name: "ICT (Teknolojia ya Habari & Mawasiliano)",
    overview: "Inajumuisha usimamizi wa miundombinu ya mitandao ya kompyuta, msaada wa kiufundi, na usimamizi wa mifumo ya mawasiliano katika taasisi. Tofauti na Computer Science ambayo inajikita zaidi kwenye coding, ICT inajikita kwenye usimamizi wa miundombinu na matumizi ya system.",
    careers: ["Network Administrator", "IT Support Engineer", "System Administrator", "Information Security Specialist"],
    salary: "TZS 1,000,000 - TZS 2,800,000 / mwezi",
    skills: ["Network Configurations (CCNA)", "Hardware Maintenance", "Operating Systems (Linux, Windows)", "Cybersecurity Basics"],
    universities: ["UDOM", "DIT", "IFM", "CBE", "UDSM"]
  },
  {
    id: "accounting",
    name: "Accounting & Finance (Uhasibu na Fedha)",
    overview: "Uhasibu huhusisha utunzaji wa kumbukumbu za kifedha, ukaguzi wa vitabu (Auditing), hesabu za kodi, na kupanga mikakati ya kifedha kwa mashirika au watu binafsi. Kufanya mitihani ya CPA baada ya chuo kunaongeza thamani kubwa.",
    careers: ["Accountant", "Auditor", "Financial Analyst", "Tax Consultant", "Credit Analyst"],
    salary: "TZS 800,000 - TZS 3,000,000 / mwezi",
    skills: ["Hisabati / Data Analysis", "Financial Standards (IFRS)", "QuickBooks / Tally", "Audit Methodologies"],
    universities: ["IFM", "Mzumbe University", "CBE", "TIA", "UDSM"]
  },
  {
    id: "architecture",
    name: "Architecture (Usanifu Majengo)",
    overview: "Kozi hii inahusisha masuala ya ubunifu, kuchora, na kupanga muonekano wa majengo na miji kwa kuzingatia usalama, uzuri, na gharama. Ndicho kiungo kikubwa kati ya sanaa na uhandisi wa ujenzi.",
    careers: ["Architect", "Interior Designer", "Urban Planner", "Building Inspector", "Construction Consultant"],
    salary: "TZS 1,200,000 - TZS 3,200,000 / mwezi",
    skills: ["Creative Drawing", "AutoCAD / ArchiCAD / Revit", "Structural Knowledge", "3D Rendering"],
    universities: ["Ardhi University (ARU)", "UDSM"]
  }
];

export const UNIVERSITIES = [
  {
    id: "udsm",
    name: "University of Dar es Salaam (UDSM)",
    nickname: "Mlimani",
    location: "Dar es Salaam (CoET, UDBS, CoICT, Mlimani Campus)",
    programs: ["Engineering", "Computer Science", "Law (LLB)", "Medicine", "Arts", "Science", "Commerce", "Education"],
    requirements: "Form 6 sifa za chini ni Points 4 za principal passes katika masomo ya combination husika. Kwa Diploma: GPA ya 3.0 au zaidi katika stashahada husika.",
    fees: "TSH 1,300,000 - TSH 2,200,000 kwa mwaka kutegemeana na kozi",
    website: "https://www.udsm.ac.tz",
    guide: "Maombi yote yanafunguliwa kupitia UDSM Admission Portal (udsm.smis.ac.tz). Unapaswa kulipia ada ya maombi (TSH 10,000), jaza matokeo yako ya f4 na f6 au Diploma, kisha chagua kozi hadi tano kulingana na vipaumbele vyako."
  },
  {
    id: "dit",
    name: "Dar es Salaam Institute of Technology (DIT)",
    nickname: "DIT",
    location: "Dar es Salaam (Kati)",
    programs: ["Civil Engineering", "Computer Engineering", "Electrical Engineering", "Electronics & Telecommunications", "Science Technology"],
    requirements: "Form 6 Physics na Maths ni lazima kuwa na ufaulu wa kiwango cha Principal. Diploma: Stashahada ya Uhandisi yenye angalau GPA ya 3.0 au uzoefu wa kazi uliothibitishwa.",
    fees: "TSH 1,200,000 - TSH 1,800,000 kwa mwaka",
    website: "https://www.dit.ac.tz",
    guide: "Maombi hufanywa kupitia mfumo wa TCU au moja kwa moja kupitia portal ya DIT Online Application System (OAS). Hakikisha vyeti vyako vya Form 4 na Form 6 viko sawa. Ada ya application ni TSH 10,000 tu."
  },
  {
    id: "mzumbe",
    name: "Mzumbe University",
    nickname: "Mzumbe",
    location: "Morogoro (Main Campus) / Dar es Salaam / Mbeya",
    programs: ["Law", "Public Administration", "Health Systems Management", "Accounting & Finance", "Business Administration", "Human Resource Management"],
    requirements: "Form 6: Principal Passes mbili zenye jumla ya pointi 4. Law inahitaji ufaulu mkubwa katika History au English. Diploma: Mtahiniwa awe na Stashahada inayotambuliwa na TCU na GPA ya 3.0+.",
    fees: "TSH 1,100,000 - TSH 1,900,000 kwa mwaka",
    website: "https://www.mzumbe.ac.tz",
    guide: "Tembelea application.mzumbe.ac.tz wakati wa kupokea maombi ya TCU. Hakikisha unaandikisha index number za Form 4 na Form 6 kwa usahihi kwa ajili ya kuvuta matokeo yako moja kwa moja kutoka NECTA."
  },
  {
    id: "udom",
    name: "University of Dodoma (UDOM)",
    nickname: "UDOM",
    location: "Dodoma (Chimwaga, College of Informatics, Humanities, etc.)",
    programs: ["ICT & Telecommunications", "Computer Science", "Medicine & Surgery", "Nursing", "Education (B.Ed)", "Natural Sciences", "Social Work"],
    requirements: "Form 6: Sifa ya jumla ni passes mbili za principal. Kwa kozi ya MD (Daktari) inahitaji alama za juu sana kwenye Chemistry, Biology na Physics (PCB).",
    fees: "TSH 1,000,000 - TSH 2,200,000 kwa mwaka",
    website: "https://www.udom.ac.tz",
    guide: "Sajili akaunti yako kwenye udom.ac.tz/apply. Jaza fomu na upakie cheti cha kuzaliwa na picha. Chagua kozi zinazokufaa na uthibitishe chaguo lako kupitia namba ya malipo ya serikali (Control Number)."
  },
  {
    id: "sua",
    name: "Sokoine University of Agriculture (SUA)",
    nickname: "SUA",
    location: "Morogoro (Edward Moringe & Solomon Mahlangu Campuses)",
    programs: ["Agriculture General", "Veterinary Medicine", "Forestry & Nature Conservation", "Food Science & Technology", "Agribusiness", "Environmental Sciences"],
    requirements: "Form 6: Sifa teule ya kilimo au mifugo inahitaji Biology, Chemistry au Jografia. Veterinary inahitaji principal 2 za sayansi. Diploma ya kilimo GPA ya 3.0+.",
    fees: "TSH 1,000,000 - TSH 1,500,000 kwa mwaka (Isipokuwa Veterinary yenye gharama zaidi)",
    website: "https://www.sua.ac.tz",
    guide: "Omba mtandaoni kupitia sua.smis.ac.tz. Lipia ada ya maombi, weka index details yako ya NECTA na uchague kozi uipendayo. Chuo hiki kina sifa kubwa duniani katika tafiti za kilimo na mifugo."
  },
  {
    id: "ifm",
    name: "Institute of Finance Management (IFM)",
    nickname: "IFM",
    location: "Dar es Salaam (Kati) / Mwanza / Dodoma",
    programs: ["Banking & Finance", "Accounting", "Insurance & Risk Management", "Information Technology", "Tax Management", "Social Protection"],
    requirements: "Form 6: Passes mbili za Principal. Masomo ya hisabati na uchumi hutoa kipaumbele kikubwa. Diploma: GPA ya 3.0 katika fani zinazoendana.",
    fees: "TSH 1,200,000 - TSH 1,800,000 kwa mwaka",
    website: "https://www.ifm.ac.tz",
    guide: "Fungua portal kupitia admission.ifm.ac.tz, weka maelezo yako ya kibinafsi, chagua kozi tatu, kisha fanya malipo ya application fee kwa GePG. Fuatilia status ya udahili kwenye akaunti yako."
  },
  {
    id: "cbe",
    name: "College of Business Education (CBE)",
    nickname: "CBE",
    location: "Dar es Salaam / Dodoma / Mwanza / Mbeya",
    programs: ["Business Administration", "Marketing", "Procurement & Supply", "Metrology & Standardization", "Information Technology"],
    requirements: "Form 6: Principal Passes mbili. Math na English ya Form 4 ni lazima kupita angalau kiwango cha D. Diploma: GPA ya 3.0 au zaidi.",
    fees: "TSH 900,000 - TSH 1,400,000 kwa mwaka",
    website: "https://www.cbe.ac.tz",
    guide: "Nenda kwenye tovuti ya cbe.ac.tz na ubofye 'Online Application link'. Jaza namba za vyeti, chagua campus unayotaka kusoma (Mfano Dar au Dodoma) na moduli za kozi. Mfumo ni rahisi sana."
  },
  {
    id: "ardhi",
    name: "Ardhi University (ARU)",
    nickname: "Ardhi",
    location: "Dar es Salaam (Mlimani - Karibu na UDSM)",
    programs: ["Architecture", "Civil Engineering", "Geomatics (In geodesy)", "Urban & Regional Planning", "Real Estate & Finance", "Environmental Engineering"],
    requirements: "Form 6 Architecture inahitaji ufaulu mzuri wa Hesabati, Jografia na Fizikia au Sanaa. Engineering inahitaji Physics na Maths ya kukidhi.",
    fees: "TSH 1,300,000 - TSH 2,500,000 kwa mwaka",
    website: "https://www.aru.ac.tz",
    guide: "Maombi hufanywa kupitia aru.ac.tz kupitia kiungo cha udahili ARU-OAS. Chagua kozi zako kwa uangalifu mkuu kwani kozi kama Architecture hazina ushindani mkubwa lakini nafasi zake ni chache."
  },
  {
    id: "nmaist",
    name: "Nelson Mandela African Institution of Science & Technology (NM-AIST)",
    nickname: "Nelson Mandela",
    location: "Arusha (Tengeru)",
    programs: ["Bioengineering & Life Sciences", "Materials & Metallurgical Eng", "Information & Communication Tech (MSc/PhD)", "Sustainable Resources Management"],
    requirements: "Hiki ni chuo cha Uzamili na Uzamifu (Postgraduate pekee). Unahitaji kuwa na Digrii ya kwanza yenye GPA ya angalau 3.8/5.0 au uzoefu bora sana wa kitaaluma.",
    fees: "TSH 2,500,000 - TSH 4,000,000 kwa mwaka",
    website: "https://www.nm-aist.ac.tz",
    guide: "Pakua fomu ya maombi na mapendekezo (References) kutoka kwenye tovuti ya chuo, jaza na upakie mtandaoni pamoja na pendekezo la utafiti (Research Proposal) wako."
  },
  {
    id: "muhas",
    name: "Muhimbili University of Health and Allied Sciences (MUHAS)",
    nickname: "Muhimbili",
    location: "Dar es Salaam (Upanga & Mloganzila)",
    programs: ["Medicine & Surgery (MD)", "Pharmacy (B.Pharm)", "Nursing (BSc.N)", "Dentistry (DDS)", "Medical Lab Tech"],
    requirements: "Form 6: PCB combination yenye angalau ufaulu wa C, C, C (Pointi 9). Ushindani ni mkubwa mno, mara nyingi wanafanikiwa wenye Pointi 12+.",
    fees: "TSH 2,000,000 - TSH 5,000,000 kwa mwaka",
    website: "https://www.muhas.ac.tz",
    guide: "Maombi huwasilishwa katika Muhimbili Admission Portal kupitia kiungo rasmi oas.muhas.ac.tz. Hakikisha unaandika namba yako ya NECTA kwa usahihi wa kipekee kwa sababu kila pointi moja ina umuhimu hapa."
  }
];

export const CAREERS = [
  {
    id: "software_engineer",
    title: "Software Engineer (Mhandisi wa Programu)",
    responsibilities: "Kubuni, kuandika nambari za algorithms (coding), kufanyia majaribio programu za kompyuta, na kurekebisha changamoto za kimfumo ili kurahisisha kazi na huduma za kibiashara na kiserikali.",
    skills: ["Uelewa mzuri wa lugha kama JavaScript, Python, Java au C#", "Utatuzi wa matatizo (Problem-solving)", "Kufanya kazi kwa timu (Git & Agile)", "Maarifa ya kutosha ya databases (SQL/NoSQL)"],
    growth: "Kasi kubwa mno ya kukua nchini Tanzania. Na fursa nyingi za kufanya kazi kijijini (Remote) kwa makampuni ya kimataifa au kuanzisha tech startup yako.",
    salary: "TZS 1,500,000 - TZS 6,000,000+ kwa mwezi wa kazi"
  },
  {
    id: "doctor",
    title: "Medical Doctor (Daktari wa Binadamu)",
    responsibilities: "Kufanya uchunguzi wa magonjwa, kutoa ushauri wa afya, kuandika maelekezo ya dawa, na kufanya upasuaji wa kuokoa maisha ya wagonjwa katika hospitali binafsi au za serikali.",
    skills: ["General medicine & diagnostic clinical acumen", "Kazi chini ya presha na masaa mengi", "Stahimilivu na hisia za kiutu (Empathy)", "Kujifunza kila siku kuhusu madawa mapya"],
    growth: "Baada ya kupata MD, unaweza kuendelea kusomea Bingwa (Specialist) wa magonjwa ya watoto, uzazi, moyo, au upasuaji mkubwa ambapo mahitaji yake ni makubwa zaidi nchini.",
    salary: "TZS 1,800,000 - TZS 4,500,000 kwa mwezi"
  },
  {
    id: "lawyer",
    title: "Advocate & Lawyer (Mwanasheria / Wakili)",
    responsibilities: "Kuwakilisha wateja mahakamani, kutoa rai na ushauri wa kisheria kwa watu na makampuni, kuandaa na kukagua mikataba ya kisheria, na kusuluhisha migogoro ya kisheria.",
    skills: ["Uwezo mkubwa wa ushawishi (Public speaking)", "Kusoma na kuchambua nyaraka ndefu kwa haraka", "Excellent writing and negotiation skills", "Ethics na uaminifu thabiti"],
    growth: "Unaweza kuajiriwa kama corporate secretary, mwanasheria wa serikali (State Attorney), jaji, au kuanzisha ofisi yako ya sheria (Law Firm) na kuajiri wengine.",
    salary: "TZS 1,200,000 - TZS 7,000,000+ kulingana na uzoefu"
  },
  {
    id: "teacher",
    title: "Teacher / Educator (Mwalimu)",
    responsibilities: "Kuandaa somo kulingana na silabi (Syllabus), kuingia darasani kufundisha wanafunzi, kutunga mitihani na kusahihisha ili kupima weledi na maendeleo ya taaluma ya mwanafunzi.",
    skills: ["Mawasiliano mazuri na uwasilishaji mada (Presentation)", "Uvumilivu thabiti na upendo kwa wanafunzi", "Kuandaa maelekezo ya masomo (Lesson planning)", "Tathmini ya kisaikolojia ya mtoto"],
    growth: "Kupanda daraja kuwa Mkuu wa Idara, Makamu Mkuu wa Shule, Mkuu wa Shule, Mkaguzi wa shule, au kufundisha vyuo vya ualimu (Tutor) baada ya kufanikisha Masters degree.",
    salary: "TZS 550,000 - TZS 1,800,000 kulingana na shule ya serikali/private"
  },
  {
    id: "pilot",
    title: "Commercial Pilot (Rubani wa Ndege)",
    responsibilities: "Kuendesha ndege za abiria au mizigo kwa usalama kamili, kupanga njia ya kuruka kulingana na hali ya hewa, na kuwasiliana na wasaidizi wa ardhini kuzuia makosa ya angani.",
    skills: ["Umakini wa hali ya juu na spatial orientation", "Kufanya maamuzi haraka sana na utulivu wakati wa dharura", "Utimamu mkamilifu wa afya ya macho, mwili, na akili", "Masuala ya fizikia na hewa (Aerodynamics)"],
    growth: "Ruba msaidizi (First Officer) hupanda hadhi na kuwa Kapteni kamili (Captain) wa ndege kubwa. Fani hii inalipa sana na inatoa fursa ya kutembea duniani kote.",
    salary: "TZS 3,500,000 - TZS 12,000,000+ kwa mwezi"
  },
  {
    id: "architect",
    title: "Architect (Msanifu Majengo)",
    responsibilities: "Kubuni miundo na ramani za majengo ya kibiashara, makazi na viwanda. Kuhakikisha miundo inakidhi vigezo vya mazingira, usalama wa nchi na matakwa ya mteja.",
    skills: ["Ubunifu mkubwa wa sanaa (Creative arts & spatial design)", "Ustadi wa kutumia program kama ArchiCAD, AutoCAD, Revit na Blender", "Familiarity with building regulations and structural limits", "Project and cost estimation"],
    growth: "Wasanifu majengo wanaweza kufanya kazi na makampuni makubwa ya ujenzi au kujiandikisha na Bodi ya Wasanifu Majengo na Wakadiriaji Makadirio (AQRB) na kuanzisha kampuni binafsi.",
    salary: "TZS 1,500,000 - TZS 5,000,000 kwa mwezi"
  },
  {
    id: "data_analyst",
    title: "Data Analyst (Mchambuzi wa Data)",
    responsibilities: "Kukusanya data, kuisafisha, na kuichambua kwa kutumia takwimu ili kutoa ripoti zinazosaidia makampuni na serikali kufanya maamuzi sahihi ya kimkakati, mauzo au huduma.",
    skills: ["SQL querying knowledge", "Vizualisation tools (PowerBI, Tableau, Excel)", "Programming basics (Python or R is highly preferred)", "Statistical mindset and business understanding"],
    growth: "Kutokana na ongezeko la matumizi ya mifumo, data analysts wana mahitaji makubwa katika benki, kampuni za simu, mashirika ya afya, na utafiti wa kisayansi.",
    salary: "TZS 1,200,000 - TZS 4,000,000 kwa mwezi"
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity Analyst (Mtaalamu wa Usalama Mtandao)",
    responsibilities: "Kulinda mifumo ya kompyuta, mitandao, na data za taasisi dhidi ya mashambulio na wizi wa kidijitali (Hacking). Kufanya vipimo vya kiusalama mara kwa mara (Penetration Testing).",
    skills: ["Network protocols and firewall management", "Linux OS proficiency", "Knowledge of web vulnerabilities (OWASP Top 10)", "Ethical hacking tools & Kali Linux"],
    growth: "Makaazi thabiti ya kiusalama yanahitajika sana katika Benki zote nchini, makampuni ya mitandao ya simu na asasi za usalama wa serikali. Thamani ya fani hii ni juu sana.",
    salary: "TZS 1,800,000 - TZS 5,500,000 kwa mwezi"
  },
  {
    id: "ai_engineer",
    title: "AI & Machine Learning Engineer",
    responsibilities: "Kubengua na kupika mifano mbalimbali ya kiakili (AI models), kama chatbots zinazojielekeza, mifumo ya kutabiri masoko, tafsiri za lugha kwa njia ya kompyuta, na automation mifumo ya kiufundi.",
    skills: ["High mathematics proficiency (calculus & linear algebra)", "Python & Machine Learning frameworks (PyTorch, TensorFlow)", "Data engineering and model deployment", "Good understanding of LLMs (Gemini, GPT)"],
    growth: "Hii ni fani mpya na yenye soko kubwa duniani kote ikianza kushika kasi ya kipekee barani Afrika. Inatazamwa kuwa nguzo ya sayansi ya kompyuta siku za usoni.",
    salary: "TZS 2,000,000 - TZS 8,000,000+ kwa mwezi"
  },
  {
    id: "accountant",
    title: "Certified Accountant (Mhasibu)",
    responsibilities: "Kukusanya, kuchambua na kuandaa ripoti za kifedha kwa ajili ya usimamizi wa ndani au wadau wa nje. Kusimamia masuala ya kodi (TRA compliance) na ukaguzi wa mapendekezo ya biashara.",
    skills: ["Accounting Standards (IFRS & IPSAS)", "Proficiency in Accounting Software (QuickBooks, SAP)", "Excel formulas and data processing", "Tax laws of Tanzania and compliance rules"],
    growth: "Kwa kupata cheti kibeba thamani cha CPA (Tanzania), unafuzu kuwa Mhasibu Mwandamizi (Chief Accountant) au Mkurugenzi wa Fedha (CFO) wa benki au shirika kubwa.",
    salary: "TZS 800,000 - TZS 3,500,000 (Inakua zaidi kwa mwenye CPA ya NBAA)"
  }
];

export const STUDY_ABROAD = [
  {
    id: "china",
    country: "China (Jamhuri ya Watu wa China)",
    scholarships: "CSC Scholarship (Ufadhili wa Serikali ya China), Confucius Institute Scholarship, Provincial Government Scholarships na Ufadhili wa Vyuo Binafsi (University Scholarships).",
    requirements: "Cheti cha Form 6 (GPA kubwa), Cheti cha kuzaliwa, Hati ya kusafiria (Passport), Vyeti vya Afya (Foreigner Physical Exam), na barua mbili za mapendekezo kutoka kwa walimu wako wa awali. Kujua Kichina (HSK level) ni faida kubwa sana lakini sio lazima kwa kozi za Kiingereza.",
    process: "1. Tembelea tovuti ya CSC (campuschina.org) na ujaze ombi mtandaoni mwezi Desemba hadi Machi kila mwaka.\n2. Chagua vyuo vitatu unavyovalia kupata udahili.\n3. Omba Pre-Admission Letter kutoka kwenye chuo unachokitaka.\n4. Tuma nyaraka ngumu (Hard copies) kwa Ubalozi wa China au Wizara ya Elimu nchini Tanzania."
  },
  {
    id: "turkey",
    country: "Turkey (Uturuki)",
    scholarships: "Türkiye Bursları Scholarship (Ufadhili Kamili wa Uturuki) unaofunika Ada, Malazi, Tiketi ya Ndege, Bima ya Afya, na msaada wa fedha ya mfukoni kila mwezi.",
    requirements: "Umri chini ya miaka 21 kwa undergraduate. Wastani wa NECTA Form 4 na Form 6 uwe angalau 70% (Div II au I). Nyaraka: Vyeti vyote vya shule, Passport, na Barua ya Motisha (Letter of Intent/Statement of Purpose).",
    process: "1. Jisajili katika tovuti rasmi ya turkiyeburslari.gov.tr mwezi Januari au Februari kila mwaka.\n2. Pakia nyaraka zako na uandike insha zako za ushawishi zilizoombwa.\n3. Chagua vyuo na kozi unazotamani kusomea nchini Uturuki.\n4. Waliochaguliwa (Shortlisted) wataitwa kwenye usahili wa ana kwa ana katika Ubalozi wa Uturuki jijini Dar es Salaam mwezi Juni/Julai."
  },
  {
    id: "malaysia",
    country: "Malaysia (Malaysia)",
    scholarships: "MIS Scholarship (Malaysia International Scholarship) kwa Master & PhD. Pia kuna vyuo vikuu vingi vya kimataifa kule vyenye kutoa punguzo kubwa la ada kwa wanafunzi wa Afrika.",
    requirements: "Undergraduate: Angalau principal passes mbili zenye daraja zuri. Alama nzuri ya English ya Form 4 (Grade C au B) au cheti cha lugha kama IELTS/TOEFL. Passport halali na Vyeti thabiti vya shule.",
    process: "1. Omba udahili kwenye chuo kikuu cha Malaysia moja kwa moja mtandaoni (Mfano: Universiti Malaya, APU, Taylor's University).\n2. Mara baada ya kupata Admission, omba Visa Approval Letter (VAL) kupitia shirika la EMGS (educationmalaysia.gov.my).\n3. Wakati huo huo, wasilisha maombi ya scholarship au msaada wa ada kutoka kwa mashirika au chuo chenyewe.\n4. Nenda ubalozini kupata visa ya kuingilia nchini humo."
  },
  {
    id: "canada",
    country: "Canada (Kanada)",
    scholarships: "Lester B. Pearson International Scholarship (Uofatili wa Chuo Kikuu cha Toronto - kamili), Mastercard Foundation Scholarships, na vyuo kutoa udhamini wa tafiti (Research Assistantships) kwa Uzamili.",
    requirements: "Wastani mkubwa sana wa ufaulu (Division I safi). Matokeo thabiti ya kiingereza (IELTS Academic au TOEFL). Barua kali sana za mapendekezo na insha inayoeleza uongozi wako kwenye jamii.",
    process: "1. Shule yako ya sekondari lazima ikupendekeze kwanza kwa mfumo wa Pearson Scholarship mapema mwezi Novemba.\n2. Omba udahili Chuo Kikuu cha Toronto kwa kozi yoyote ya kwanza.\n3. Kamilisha insha zako binafsi na uzitume kwa chuo.\n4. Ukifanikiwa kupata udahili na udhamini, wasilisha maombi ya Study Permit kupitia ubalozi au mtandaoni (IRCC Portal)."
  },
  {
    id: "uk",
    country: "United Kingdom (Uingereza - UK)",
    scholarships: "Chevening Scholarship (Ufadhili kamili wa Serikali ya UK kwa Masters), Commonwealth Scholarships, na Rhodes Scholarships kwa utafiti kikuu cha Oxford.",
    requirements: "Digrii nzuri ya kwanza ikionyesha ufaulu wa kiwango cha juu (First Class au Upper Second Class). Uzoefu wa kazi wa masaa yasiyopungua 2,800 kwa Chevening. Cheti cha IELTS Academic (Band 6.5+).",
    process: "1. Wasilisha maombi ya udahili kwa angalau vyuo vikuu vitatu vya Uingereza vinavyotambulika.\n2. Sajili maombi ya Chevening kupitia chevening.org mwezi Agosti hadi Novemba kionyesha uzuri wa ushawishi wako kijamii na mipango ya baadae.\n3. Fanya mtihani wa IELTS thabiti.\n4. Waliochujwa hufanyiwa mahojiano magumu katika ubalozi wa Uingereza (British High Commission) jijini Dar es Salaam."
  },
  {
    id: "usa",
    country: "United States of America (Marekani - USA)",
    scholarships: "Fulbright Foreign Student Program (kwa masters na PhD), Mastercard Foundation Scholarships katika vyuo teule kama Arizona State, ASU, na Financial Aid ya vyuo wenyewe (Need-based financial aid - mfano Harvard, Yale, MIT).",
    requirements: "Kuhitimu vyema Form 6 au Chuo. Mara nyingi inahitajika kufanya mitihani ya SAT (kwa undergraduate) au GRE/GMAT (kwa masters), na mtihani wa kiingereza (TOEFL au Duolingo English Test).",
    process: "1. Tafuta vyuo vinavyotoa udhamini thabiti na uonyeshe interest yako mapema (Desemba/Januari).\n2. Fanya mitihani inayohitajika (SAT/ACT/TOEFL) na pakia ripoti zako za sekondari tangu Form 1 hadi Form 6.\n3. Waombe walimu 2-3 kuandika barua kali za mapendekezo (Recommendations).\n4. Ukipokelewa (I-20 Form iliyotolewa), lipia ada ya SEVIS na fanya maombi ya US Student Visa (F-1 Visa) ubalozini Dar es Salaam."
  }
];

export const SCHOLARSHIPS_LIST = [
  {
    id: "sch_csc",
    name: "Chinese Government Scholarship (CSC)",
    level: "Undergraduate / Masters / PhD",
    country: "China",
    courseInterest: "Science, Tech, Engineering, Agriculture, Medicine",
    benefit: "Udhamini wa Ada 100%, Malazi bure chuoni, Bima ya Afya na TZS 800k - 1.2M mfukoni kila mwezi",
    applyMonth: "Desemba hadi Aprili kila mwaka"
  },
  {
    id: "sch_turk",
    name: "Türkiye Bursları Scholarship",
    level: "Undergraduate / Masters / PhD",
    country: "Turkey",
    courseInterest: "Engineering, Medicine, Law, Business, Accounting, All Courses",
    benefit: "Masomo bure kabisa, tiketi ya ndege ya kwenda na kurudi, bima, malazi kwenye hosteli za kisasa, na mshahara wa masomo",
    applyMonth: "Januari hadi Februari kila mwaka"
  },
  {
    id: "sch_chev",
    name: "UK Chevening Scholarship",
    level: "Masters",
    country: "UK",
    courseInterest: "Law, Business, Computer Science, Engineering, Public Health",
    benefit: "Gharama zote zinalipwa - tiketi ya ndege, maisha ya sasa nchini UK, ada yote ya chuo kikuu chochote nchini humo",
    applyMonth: "Agosti hadi Novemba kila mwaka"
  },
  {
    id: "sch_pearson",
    name: "Lester B. Pearson International Scholarship",
    level: "Undergraduate",
    country: "Canada",
    courseInterest: "Computer Science, Medicine/Sciences, Engineering, Business",
    benefit: "Ufadhili wa ada ya masomo, vitabu bure, gharama za dharura, na usafiri nchini Kanada",
    applyMonth: "Novemba kila mwaka"
  },
  {
    id: "sch_fulb",
    name: "Fulbright Graduate Fellowship Program",
    level: "Masters / PhD",
    country: "USA",
    courseInterest: "Engineering, Agriculture, ICT, Law, Business/Economics",
    benefit: "Ufadhili kamili wa masomo ya uzamili nchini Marekani ikiwa ni pamoja na bima na bodi kamili ya maisha",
    applyMonth: "Novemba hadi Januari kila mwaka"
  },
  {
    id: "sch_local_heslb",
    name: "HESLB Board Loans (Bodi ya Mikopo ya Elimu ya Juu)",
    level: "Undergraduate / Diploma",
    country: "Local Tanzania",
    courseInterest: "Medicine, Science Education, Engineering, ICT/Tech, Agriculture, Law",
    benefit: "Mkopo wa Ada (hadi 100%), posho ya chakula na malazi (TSH 10,000 kwa siku), posho ya vitabu na miradi ya shule",
    applyMonth: "Julai hadi Septemba kila mwaka"
  },
  {
    id: "sch_mcf_asu",
    name: "Mastercard Foundation Fellowship",
    level: "Undergraduate / Masters",
    country: "USA",
    courseInterest: "Science, Engineering, Agriculture, Public Health",
    benefit: "Udhamini wa 100% wa gharama zote ikajumuisha maisha Marekani na msaada wa kurejea nchini kujenga uchumi",
    applyMonth: "Oktoba hadi Desemba kila mwaka"
  },
  {
    id: "sch_moest_hungary",
    name: "Stipendium Hungaricum Scholarship (Hungary)",
    level: "Undergraduate / Masters",
    country: "Turkey", // Fits closest to Europe/Turkey category
    courseInterest: "Engineering, Agriculture, Computer Science, Economics",
    benefit: "Ufadhili mzima wa ada kupitia ushirikiano wa serikali ya Tanzania, bima ya afya ya kimataifa na mchango wa malazi",
    applyMonth: "Desemba hadi Januari"
  }
];
