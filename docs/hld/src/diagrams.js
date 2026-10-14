const { page } = require('./diagram-base');
const D = {};

// ---------- A1 Context ----------
D['A1-context'] = page(`
<div class="row" style="align-items:stretch">
  <div class="col" style="width:235px">
    <div class="lbl">People inside the university</div>
    <div class="box blue" id="staff"><div class="t">Finance &amp; administration staff</div><div class="s">Budget maker/checker · Finance Officer · Vice Chancellor · Registrar · Cash &amp; Bank user · Accounts user · Auditor (read-only)</div></div>
    <div class="box blue" id="hr"><div class="t">Payroll section</div><div class="s">Employee records · monthly salary batch · loans · GPF / NPS / GIS / TDS liabilities</div></div>
    <div class="box blue" id="coe"><div class="t">Examination section (COE)</div><div class="s">Exams and centres · duty orders · claim verification · cumulative list</div></div>
    <div class="box blue" id="store"><div class="t">Stores &amp; departments</div><div class="s">Requisitions · GRN · issues · physical verification · asset candidates</div></div>
    <div class="box blue" id="admin"><div class="t">System administrator</div><div class="s">Users, roles, approval matrix, masters, financial year</div></div>
  </div>
  <div style="width:60px"></div>
  <div class="col" style="width:330px;justify-content:center">
    <div class="box navy" id="ifms" style="padding:16px 14px;text-align:center">
      <div class="t" style="font-size:15px">IFMS</div>
      <div class="s" style="margin-top:4px">Integrated Financial Management System</div>
      <div class="s" style="margin-top:8px;color:#fff">Budget · Fee Revenue Import · Cash &amp; Bank · Finance &amp; Accounting · HR &amp; Payroll · Examination · Inventory &amp; Assets</div>
      <div class="s" style="margin-top:8px">One web application, two portals (ERP and Examiner), one database</div>
    </div>
  </div>
  <div style="width:60px"></div>
  <div class="col" style="width:235px">
    <div class="lbl grey">Outside the university</div>
    <div class="box green" id="examiner"><div class="t">External examiners</div><div class="s">Log in from the emailed duty order · accept duties · upload claims and bills · track payment</div></div>
    <div class="box grey" id="portal"><div class="t">University fee portal / HDFC gateway</div><div class="s">Existing system; sends each completed affiliation and examination fee payment</div></div>
    <div class="box grey" id="bank"><div class="t">Banks (SBI, HDFC, others)</div><div class="s">Bulk NEFT/RTGS files and cheques out · statements and FD advices in</div></div>
    <div class="box grey" id="stat"><div class="t">Statutory bodies</div><div class="s">NPS CRA · GPF / GIS · Income-tax (TDS) · GST — export files and challans, no live link</div></div>
    <div class="box grey" id="tally"><div class="t">Tally (one time)</div><div class="s">Opening trial balance at cut-over</div></div>
    <div class="box grey" id="mail"><div class="t">University e-mail (SMTP)</div><div class="s">Duty orders, approvals, alerts</div></div>
  </div>
</div>
<div class="note">Solid arrows: people using screens. Dashed arrows: system-to-system; the direction is the direction of data.</div>
`, `
['#staff','#hr','#coe','#store','#admin'].forEach(s=>connect(s,'#ifms',{from:'right',to:'left',color:'#1F3F7A',mid:260}));
connect('#examiner','#ifms',{from:'left',to:'right',color:'#1B5E45',mid:700});
connect('#portal','#ifms',{from:'left',to:'right',dash:true,color:'#4B5563',mid:700});
connect('#ifms','#bank',{from:'right',to:'left',dash:true,color:'#4B5563',mid:700});
connect('#ifms','#stat',{from:'right',to:'left',dash:true,color:'#4B5563',mid:700});
connect('#tally','#ifms',{from:'left',to:'right',dash:true,color:'#4B5563',mid:700});
connect('#ifms','#mail',{from:'right',to:'left',dash:true,color:'#4B5563',mid:700});
`);

// ---------- A2 Containers ----------
D['A2-containers'] = page(`
<div class="row" style="justify-content:space-between;align-items:stretch">
  <div class="col" style="width:190px">
    <div class="lbl blue">Client</div>
    <div class="box blue" id="browser" style="flex:1"><div class="t">Browser</div><div class="s">Chrome / Edge on university PCs; examiners from anywhere. Screens, grids, forms. <b>Never calculates money.</b></div></div>
  </div>
  <div class="col" style="width:200px">
    <div class="lbl blue">Web tier · HTTPS</div>
    <div class="box blue" id="web" style="flex:1"><div class="t">Next.js web app</div><div class="s">TypeScript · App Router. Serves the ERP portal and the Examiner portal. Keeps the login cookie and forwards each call to the API as a bearer token (BFF). <b>No database access.</b></div></div>
  </div>
  <div class="col" style="width:220px">
    <div class="lbl">Application tier · REST + JWT</div>
    <div class="box navy" id="api" style="flex:1"><div class="t">IFMS API · Spring Boot 3.4</div><div class="s">One deployable. Every business rule, approval and posting. Scheduled jobs run inside it. OpenAPI contract. The <b>only</b> writer to the database.</div></div>
  </div>
  <div class="col" style="width:220px">
    <div class="lbl">Data tier · private network</div>
    <div class="box green" id="db" style="flex:1"><div class="t">PostgreSQL 16</div><div class="s">One database, one schema per module. Masters, documents, workflow, the three ledgers, audit trail.</div></div>
    <div class="box green" id="minio" style="flex:1"><div class="t">MinIO file store (S3 API)</div><div class="s">Bills, sanction letters, claims, challans, generated PDFs. Hash and metadata in PostgreSQL.</div></div>
  </div>
</div>
<div style="position:relative;height:100px;margin-top:44px">
  <div class="box grey" id="ops" style="position:absolute;left:0;top:0;width:235px"><div class="t">Nginx · TLS · backups</div><div class="s">Reverse proxy in front of web and API; nightly dump + WAL archive for PostgreSQL; versioned MinIO bucket</div></div>
  <div class="box grey" id="portal" style="position:absolute;left:259px;top:0;width:200px"><div class="t">Fee portal / HDFC gateway</div><div class="s">Signed webhook, JSON, one record per payment; polling fallback</div></div>
  <div class="box grey" id="smtp" style="position:absolute;left:494px;top:0;width:200px"><div class="t">University SMTP</div><div class="s">E-mail sent from an outbox table, retried on failure</div></div>
  <div class="box grey" id="files" style="position:absolute;left:729px;top:0;width:243px"><div class="t">Bank &amp; statutory files</div><div class="s">NEFT/RTGS bulk files, cheque PDFs, challans, NPS/TDS/GST exports — generated by the API, downloaded and uploaded by the user</div></div>
</div>
<div class="note">The browser never talks to the API directly, and nothing but the API talks to the database. Dashed arrows are system-to-system.</div>
`, `
connect('#browser','#web',{from:'right',to:'left',color:'#1F3F7A',straight:true});
connect('#web','#api',{from:'right',to:'left',color:'#1F3F7A',straight:true});
connect('#api','#db',{from:'right',to:'left',color:'#1B5E45',mid:742});
connect('#api','#minio',{from:'right',to:'left',color:'#1B5E45',mid:742});
connect('#portal','#api',{from:'top',to:'bottom',dash:true,color:'#4B5563',toOff:-70,mid:228});
connect('#api','#smtp',{from:'bottom',to:'top',dash:true,color:'#4B5563',fromOff:0,straight:true});
connect('#api','#files',{from:'bottom',to:'top',dash:true,color:'#4B5563',fromOff:70,mid:240});
`);

// ---------- A3 Module map ----------
D['A3-modules'] = page(`
<div class="box grey" style="background:#F7F8FA;border-style:dashed;padding:10px 12px">
  <div class="lbl grey" style="margin-bottom:8px">Shared kernel — used by every module, owns no business transaction</div>
  <div class="row" style="gap:7px">
    ${['Financial Year','Masters','Workflow &amp; approval matrix','Audit trail','Documents','Numbering','Payee master','Posting rules','Notifications','Period control'].map(t=>`<div class="box" style="flex:1;padding:6px 6px;text-align:center;background:#fff"><div class="t" style="font-size:10.5px">${t}</div></div>`).join('')}
  </div>
</div>
<div style="position:relative;height:528px;margin-top:16px">
  <div class="box green" id="fee" style="position:absolute;left:0;top:20px;width:185px"><div class="t">Fee Revenue Import</div><div class="s">webhook · validate · de-duplicate · classify · reconcile</div></div>
  <div class="box green" id="hr" style="position:absolute;left:199px;top:20px;width:185px"><div class="t">HR &amp; Payroll</div><div class="s">employees · service book · salary batch · liabilities</div></div>
  <div class="box green" id="exam" style="position:absolute;left:398px;top:20px;width:185px"><div class="t">Examination</div><div class="s">exams · examiners · duties · claims · cumulative list</div></div>
  <div class="box green" id="inv" style="position:absolute;left:597px;top:20px;width:185px"><div class="t">Inventory &amp; Assets</div><div class="s">requisition · PO · GRN · stock · asset candidates</div></div>
  <div class="box purple" id="events" style="position:absolute;left:816px;top:20px;width:156px;height:300px;border-style:dashed"><div class="t">Accounting events</div><div class="s">published after commit, consumed once by Finance:</div>
    <div class="s" style="margin-top:6px"><b>Fee</b> → receipt voucher</div>
    <div class="s"><b>HR</b> → salary accrual JV</div>
    <div class="s"><b>Examination</b> → claim accrual JV</div>
    <div class="s"><b>Inventory</b> → GRN, issue, write-off, depreciation JV</div>
    <div class="s"><b>Budget</b> → fund receipt RV, transfer voucher</div>
    <div class="s"><b>Cash &amp; Bank</b> → interest, FD, contra</div>
  </div>
  <div class="box blue" id="bud" style="position:absolute;left:0;top:200px;width:260px"><div class="t">Budget</div><div class="s">fund receipts · heads · allocation · quarterly revision · commitment · actual · re-appropriation · closing</div></div>
  <div class="box blue" id="cb" style="position:absolute;left:330px;top:200px;width:452px;text-align:center"><div class="t">Cash &amp; Bank</div><div class="s">the only module that moves money: payment vouchers, bank accounts, cheques / UTR, interest, FDs, challans</div></div>
  <div class="box navy" id="fin" style="position:absolute;left:0;top:380px;width:972px;text-align:center"><div class="t">Finance &amp; Accounting (General Ledger)</div><div class="s">chart of accounts · vouchers · ledger · trial balance · Income &amp; Expenditure · Balance Sheet · year-end</div></div>
  <div class="box grey" id="rep" style="position:absolute;left:0;top:480px;width:972px;text-align:center;border-style:dashed"><div class="t">Reports &amp; dashboards — read-only views, never a private copy of the data</div></div>
</div>
<div class="note">Solid: synchronous call inside one database transaction. Dashed: application event, delivered after commit, retried until handled. A module never reads another module's tables.</div>
`, `
connect('#fee','#bud',{toOff:-37,dash:true,color:'#1B5E45',label:'confirmed collection'});
connect('#hr','#cb',{toOff:-160,mid:262,label:'approved salary batch'});
connect('#exam','#cb',{toOff:-65,label:'approved claim list'});
connect('#inv','#cb',{toOff:135,label:'approved bill'});
connect('#bud','#cb',{from:'right',to:'left',straight:true,color:'#1F3F7A',fromOff:-10,toOff:-10,label:'available? · commit →',lx:309,ly:314});
connect('#cb','#bud',{from:'left',to:'right',straight:true,color:'#1F3F7A',fromOff:12,toOff:12,label:'← actual paid',lx:309,ly:424});
connect('#cb','#fin',{toOff:70,label:'payment voucher'});
connect('#bud','#fin',{toOff:-356,dash:true,color:'#1F3F7A',label:'fund receipt RV'});
connect('#events','#fin',{toOff:408,dash:true,color:'#4E2A86'});
connect('#fin','#rep',{dash:true,color:'#6B7280'});
`);

// ---------- A4 Payment lifecycle swimlane ----------
function lane(name, sub, body, h) {
  return `<div class="lane"><div class="name"><div>${name}${sub ? '<br><span class="small" style="color:#C9D3E3;font-weight:400">'+sub+'</span>' : ''}</div></div><div class="body" style="min-height:${h||96}px">${body}</div></div>`;
}
D['A4-payment'] = page(`
<div class="col" style="gap:0">
${lane('Browser','Cash &amp; Bank user',`
    <div class="box blue" id="s1" style="width:210px;position:absolute;left:10px;top:10px"><div class="t"><span class="num">1</span>Confirm payment</div><div class="s">Payment voucher PV/2026-27/000412 · UTR typed in · click</div></div>
    <div class="box green" id="s9" style="width:210px;position:absolute;right:10px;top:10px"><div class="t"><span class="num">9</span>Voucher shows Paid</div><div class="s">head balance and ledger already updated when the screen refreshes</div></div>`, 84)}
${lane('Next.js','BFF',`
    <div class="box blue" id="s2" style="width:210px;position:absolute;left:10px;top:10px"><div class="t"><span class="num">2</span>Forward with token</div><div class="s">cookie → Authorization: Bearer · Idempotency-Key header added</div></div>`, 84)}
${lane('API edge','security filters',`
    <div class="box grey" id="s3" style="width:250px;position:absolute;left:10px;top:10px"><div class="t"><span class="num">3</span>Authenticate · authorise · de-duplicate</div><div class="s">JWT valid? role allowed? same Idempotency-Key seen before → return the stored answer</div></div>`, 96)}
${lane('Cash &amp; Bank','module service',`
    <div class="box teal" id="s4" style="width:250px;position:absolute;left:10px;top:10px"><div class="t"><span class="num">4</span>One transaction begins</div><div class="s">load voucher · status must be Processed · segregation of duties: this user did not approve it</div></div>
    <div class="box teal" id="s8" style="width:210px;position:absolute;right:10px;top:10px"><div class="t"><span class="num">8</span>Commit</div><div class="s">audit row and outbox event <b>PaymentConfirmed</b> written in the same transaction · 200 OK</div></div>`, 100)}
${lane('Budget','module API',`
    <div class="box blue" id="s5" style="width:300px;position:absolute;left:290px;top:10px"><div class="t"><span class="num">5</span>Lock head · record actual</div><div class="s">SELECT … FOR UPDATE on the FY × Fund × Head summary · commitment becomes actual · over 100 % only with an approved exception</div></div>`, 100)}
${lane('Finance','module API',`
    <div class="box blue" id="s6" style="width:300px;position:absolute;left:290px;top:10px"><div class="t"><span class="num">6</span>Post the payment voucher</div><div class="s">posting rule PAYMENT → Dr Payable / Cr Bank · gap-free number allocated · Dr = Cr per fund, enforced by the database</div></div>`, 100)}
${lane('PostgreSQL','',`
    <div class="box green" id="s7" style="width:400px;position:absolute;left:290px;top:10px"><div class="t"><span class="num">7</span>All or nothing</div><div class="s">voucher status · budget movement · GL lines · audit_log · outbox — one COMMIT. Any failure rolls back all five.</div></div>`, 84)}
${lane('After commit','asynchronous',`
    <div class="box grey" id="s10" style="width:300px;position:absolute;right:10px;top:10px;border-style:dashed"><div class="t"><span class="num">10</span>Event handlers, retried until done</div><div class="s">HR marks the salary month Paid · e-mail to the payee from the outbox · dashboard counters refreshed</div></div>`, 84)}
</div>
<div class="note">Steps 4 to 8 are one database transaction. If step 5 finds the head exhausted the user sees “Non-Salary (Govt): available ₹28,20,000, requested ₹30,00,000” and nothing is written.</div>
`, `
connect('#s1','#s2',{color:'#1F3F7A'});
connect('#s2','#s3',{color:'#1F3F7A'});
connect('#s3','#s4',{color:'#1F3F7A'});
connect('#s4','#s5',{from:'right',to:'left',color:'#0F4C5C',mid:412});
connect('#s5','#s6',{color:'#1F3F7A'});
connect('#s6','#s7',{color:'#1F3F7A'});
connect('#s7','#s8',{from:'right',to:'bottom',color:'#1B5E45'});
connect('#s8','#s9',{from:'top',to:'bottom',color:'#1B5E45',straight:true});
connect('#s8','#s10',{from:'bottom',to:'top',dash:true,color:'#6B7280',straight:true,toOff:45});
`);

// ---------- C1 Deployment ----------
D['C1-deployment'] = page(`
<div style="position:relative;height:232px">
  <div class="box blue" id="users" style="position:absolute;left:0;top:40px;width:135px"><div class="t">Users</div><div class="s">University LAN and internet (examiners, staff off-campus). HTTPS 443 only.</div></div>
  <div class="box grey" style="position:absolute;left:160px;top:0;width:420px;height:232px;background:#F7F8FA;border-style:dashed;padding:10px">
    <div class="lbl grey">Application VM · 4 vCPU · 8 GB · Docker</div>
    <div class="box grey" id="nginx" style="background:#fff"><div class="t">Nginx</div><div class="s">TLS termination · routes /app → web, /api → API · rate-limits login and the fee webhook</div></div>
    <div class="row" style="margin-top:36px;gap:12px">
      <div class="box blue" id="web" style="flex:1"><div class="t">web (Next.js)</div><div class="s">container · 1 instance</div></div>
      <div class="box navy" id="api" style="flex:1"><div class="t">api (Spring Boot)</div><div class="s">container · 1 instance, 2 when needed (stateless) · scheduled jobs guarded by a database lock</div></div>
    </div>
  </div>
  <div class="box grey" style="position:absolute;left:600px;top:0;width:372px;height:232px;background:#F7F8FA;border-style:dashed;padding:10px">
    <div class="lbl">Data VM · 4 vCPU · 16 GB · 500 GB SSD</div>
    <div class="col" style="gap:14px">
      <div class="box green" id="pg"><div class="t">PostgreSQL 16</div><div class="s">database <b>ifms</b> · port 5432 on the private network only · WAL archived every 5 min · nightly full dump · point-in-time recovery</div></div>
      <div class="box green" id="minio"><div class="t">MinIO</div><div class="s">bucket <b>ifms-docs</b> · versioning on · 10-year retention</div></div>
      <div class="box grey" id="backup" style="background:#fff"><div class="t">Off-site copy</div><div class="s">nightly encrypted copy of dumps, WAL and bucket to a second location (university NAS or object storage)</div></div>
    </div>
  </div>
</div>
<div class="row" style="margin-top:16px;gap:12px">
  <div class="box grey" style="flex:1"><div class="t">Developer laptop</div><div class="s">docker-compose: PostgreSQL, MinIO, Mailpit · ./mvnw spring-boot:run · npm run dev</div></div>
  <div class="box grey" style="flex:1"><div class="t">UAT</div><div class="s">one VM with all containers · anonymised copy of production data · BA and client testing</div></div>
  <div class="box grey" style="flex:1"><div class="t">Production</div><div class="s">the two VMs above · hosting location to be decided (F-01) · health checks from Actuator</div></div>
</div>
<div class="note">Everything is a container started from one compose file per environment. The image that passed UAT is the image promoted to production.</div>
`, `
connect('#users','#nginx',{from:'right',to:'left',color:'#1F3F7A',mid:155});
connect('#nginx','#web',{fromOff:-100,color:'#1F3F7A'});
connect('#nginx','#api',{fromOff:100,color:'#1F3F7A'});
connect('#api','#pg',{from:'right',to:'left',color:'#1B5E45',mid:586});
connect('#api','#minio',{from:'right',to:'left',color:'#1B5E45',mid:594});
connect('#pg','#backup',{from:'right',to:'right',dash:true,color:'#6B7280',mid:981});
connect('#minio','#backup',{dash:true,color:'#6B7280'});
`);

// ---------- C5 Data architecture ----------
D['C5-data'] = page(`
<div class="box green" style="background:#F3FAF6;border-style:dashed;padding:12px">
  <div class="lbl">PostgreSQL database <span class="chip">ifms</span> — one database, one schema per module, one backup</div>
  <div class="row" style="gap:8px">
    <div class="box grey" style="width:150px;background:#fff"><div class="t">core</div><div class="s">financial_year · fund · budget_head · expense_head · bank_account · payee · user · role · workflow_* · audit_log · document · sequence · outbox</div></div>
    <div class="box blue" style="width:150px"><div class="t">budget</div><div class="s">fund_receipt · allocation · revision · reappropriation · closing · <b>budget_movement</b> (ledger) · head_balance (locked summary)</div></div>
    <div class="box green" style="width:150px"><div class="t">fee</div><div class="s">fee_transaction (raw JSONB + fields) · import_run · exception · fee_head</div></div>
    <div class="box blue" style="width:150px"><div class="t">cashbank</div><div class="s">payment_voucher · payment_line · cheque · utr · fd · interest_entry · challan · statement_line</div></div>
    <div class="box navy" style="width:150px"><div class="t">finance</div><div class="s">ledger_head · ledger_group · voucher · <b>gl_line</b> (ledger) · posting_rule (versioned) · period · opening_balance</div></div>
    <div class="box green" style="width:150px"><div class="t">hr · exam · inv</div><div class="s">employee · salary_batch · deduction · liability ·· exam · examiner · duty · claim ·· item · grn · issue · <b>stock_movement</b> (ledger) · asset</div></div>
  </div>
</div>
<div class="row" style="margin-top:14px;gap:12px">
  <div class="box orange" style="flex:1"><div class="t">Three append-only ledgers</div><div class="s">budget.budget_movement · finance.gl_line · inv.stock_movement. Rows are inserted, never updated or deleted; a correction is a new linked row. A summary row per key is locked on write and compared with the sum of its movements every night.</div></div>
  <div class="box orange" style="flex:1"><div class="t">Rules on keys and money</div><div class="s">Internal key: bigint identity. Public reference: numbered per series per financial year, gap-free, allocated at posting. Money: NUMERIC(18,2). Rates: NUMERIC(9,4). Dates: DATE; timestamps: TIMESTAMPTZ. Masters are effective-dated, never overwritten.</div></div>
  <div class="box orange" style="flex:1"><div class="t">Who may touch what</div><div class="s">A module's tables are written only by that module. Foreign keys may point to <b>core</b>; never from one business schema into another (carry the source document id instead). Reports read through views in schema <b>reporting</b>. Schema changes only through Flyway.</div></div>
</div>
`);

// ---------- C6 Security flow ----------
D['C6-security'] = page(`
<div class="row" style="justify-content:space-between;align-items:flex-start">
  <div class="col" style="width:215px">
    <div class="lbl blue">Browser</div>
    <div class="box blue" id="b1"><div class="t"><span class="num">1</span>Login form</div><div class="s">username + password (bcrypt on the server); examiners use the credentials e-mailed with the duty order</div></div>
    <div class="box blue" id="b3"><div class="t"><span class="num">3</span>Cookies only</div><div class="s">access (15 min) and refresh (8 h, rotating) as <b>httpOnly · Secure · SameSite=Strict</b>. JavaScript cannot read them.</div></div>
    <div class="box blue" id="b4"><div class="t"><span class="num">4</span>Screen call</div><div class="s">fetch /app/api/… with cookies; Origin checked by the web app</div></div>
  </div>
  <div class="col" style="width:235px">
    <div class="lbl blue">Next.js (BFF)</div>
    <div class="box blue" id="w2"><div class="t"><span class="num">2</span>Exchange</div><div class="s">POST /api/auth/login to the API; receives tokens; sets cookies; never stores them elsewhere</div></div>
    <div class="box blue" id="w5"><div class="t"><span class="num">5</span>Forward as bearer</div><div class="s">Authorization: Bearer &lt;access&gt; · refresh silently when expired · middleware blocks examiner routes for staff and staff routes for examiners</div></div>
  </div>
  <div class="col" style="width:235px">
    <div class="lbl">IFMS API</div>
    <div class="box navy" id="a6"><div class="t"><span class="num">6</span>Spring Security filter chain</div><div class="s">verify signature and expiry · load roles · @PreAuthorize on every endpoint · deny by default · no sessions, no cookies</div></div>
    <div class="box navy" id="a7"><div class="t"><span class="num">7</span>Business checks</div><div class="s">workflow engine: right step, right role, <b>not the same person twice</b> on one document · amount band from the approval matrix · period open</div></div>
    <div class="box navy" id="a8"><div class="t"><span class="num">8</span>Record</div><div class="s">audit_log: who, role, action, old → new (JSONB), remarks, IP, time — same transaction</div></div>
  </div>
  <div class="col" style="width:225px">
    <div class="lbl grey">Data protection</div>
    <div class="box orange"><div class="t">At rest</div><div class="s">bank account numbers encrypted (AES-GCM, key outside the database); PAN masked in lists; no Aadhaar stored</div></div>
    <div class="box orange"><div class="t">In transit</div><div class="s">TLS 1.2+ at Nginx; API and database on a private network</div></div>
    <div class="box orange"><div class="t">Around the code</div><div class="s">secrets from environment, never in git · dependency CVE scan in CI · upload size and type limits · login and webhook rate limits · logs without personal data</div></div>
  </div>
</div>
<div class="note">The API trusts only the bearer token. The browser holds only cookies it cannot read. A stolen cookie cannot be replayed from another site (SameSite=Strict) and expires in 15 minutes.</div>
`, `
connect('#b1','#w2',{from:'right',to:'left',color:'#1F3F7A'});
connect('#w2','#b3',{from:'left',to:'right',color:'#1F3F7A',mid:232});
connect('#b4','#w5',{from:'right',to:'left',color:'#1F3F7A',mid:232});
connect('#w5','#a6',{from:'right',to:'left',color:'#1F3F7A'});
connect('#a6','#a7',{color:'#16294A'});
connect('#a7','#a8',{color:'#16294A'});
`);

// ---------- E1 Build order ----------
D['E1-phases'] = page(`
<div class="row" style="gap:8px;align-items:stretch">
  ${[
    ['0','Foundation','repo · CLAUDE.md house rules · CI · docker-compose · skeleton with one module · login'],
    ['1','Core kernel + masters','financial year · funds · heads · chart of accounts · workflow engine · audit · numbering · payee master'],
    ['2','Budget + Fee import','fund receipts · allocation · quarterly revision · commitment · webhook import · exception queue'],
    ['3','Cash &amp; Bank + GL','bank accounts · payment voucher · cheque/UTR · posting rules · trial balance · I&amp;E · Balance Sheet'],
    ['4','HR &amp; Payroll','employees · service book · salary batch FO→VC→FO · liabilities · challans · loans'],
    ['5','Examination + Inventory','exams · examiners · duty orders · claims · capping ·· PO · GRN · stock · asset candidates'],
    ['6','Year-end + migration','re-appropriation · closing · depreciation · opening balances from Tally · UAT · go-live'],
  ].map(([n,t,s],i)=>`<div class="box ${i===0?'grey':i<4?'blue':i<6?'green':'navy'}" style="flex:1;padding:8px 8px"><div class="t"><span class="num">${n}</span>${t}</div><div class="s" style="margin-top:5px">${s}</div></div>`).join('')}
</div>
<div class="row" style="gap:8px;margin-top:8px">
  ${['—','Q-X-03 (matrix)','Q-BUD-01/03, Q-FEE-01','Q-CB-01, Q-FIN-01/02','Q-HR-01/02/04','Q-INV-04/07, Q-EXM-01','Q-FIN-07, Q-X-01'].map(q=>`<div style="flex:1;text-align:center;font-size:9.5px;color:#6B3FA0;font-weight:600">${q}</div>`).join('')}
</div>
<div class="note">Each phase ends with a demo on UAT and the ACC-005 Part D year replayed as an automated test. The purple line names the BA questions that must be closed before the phase starts.</div>
`);

module.exports = D;
