import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as xlsx from 'xlsx';
import fs from 'fs';
import Database from 'better-sqlite3';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(process.cwd(), 'ccms.sqlite');
const PORT = 3000;

let db: any;

async function initDB() {
  console.log('Initializing Database (better-sqlite3)...');
  db = new Database(DB_PATH);
  
  // Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS cost_center_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      CostCenterCode TEXT UNIQUE,
      CostCenterName TEXT,
      Department TEXT,
      Team TEXT,
      BusinessManager TEXT,
      PMO TEXT,
      HOD TEXT,
      Domain TEXT,
      Cluster TEXT,
      Cluster1 TEXT,
      Cluster2 TEXT,
      ParadigmCode TEXT,
      ParadigmCodeDescription TEXT,
      Location TEXT,
      ExCo TEXT,
      Status TEXT,
      EffectiveDate TEXT,
      LastUpdatedDate TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      RequestID TEXT UNIQUE,
      RequestType TEXT,
      ExistingCostCenterCode TEXT,
      ExistingCostCenterName TEXT,
      ProposedCostCenterCode TEXT,
      ProposedCostCenterName TEXT,
      DepartmentOld TEXT,
      DepartmentProposed TEXT,
      DepartmentFinal TEXT,
      TeamOld TEXT,
      TeamProposed TEXT,
      TeamFinal TEXT,
      BusinessManagerOld TEXT,
      BusinessManagerProposed TEXT,
      BusinessManagerFinal TEXT,
      PMOOld TEXT,
      PMOProposed TEXT,
      PMOFinal TEXT,
      HODOld TEXT,
      HODProposed TEXT,
      HODFinal TEXT,
      DomainOld TEXT,
      DomainProposed TEXT,
      ClusterOld TEXT,
      ClusterProposed TEXT,
      Cluster1Old TEXT,
      Cluster1Proposed TEXT,
      Cluster2Old TEXT,
      Cluster2Proposed TEXT,
      ParadigmCodeOld TEXT,
      ParadigmCodeProposed TEXT,
      ParadigmCodeDescriptionOld TEXT,
      ParadigmCodeDescriptionProposed TEXT,
      LocationOld TEXT,
      LocationProposed TEXT,
      ExCoOld TEXT,
      ExCoProposed TEXT,
      DomainFinal TEXT,
      ClusterFinal TEXT,
      Cluster1Final TEXT,
      Cluster2Final TEXT,
      ParadigmCodeFinal TEXT,
      ParadigmCodeDescriptionFinal TEXT,
      LocationFinal TEXT,
      ExCoFinal TEXT,
      Justification TEXT,
      SubmittedBy TEXT,
      SubmittedByEmail TEXT,
      SubmittedDate TEXT,
      Status TEXT,
      BatchSentDate TEXT,
      UpdatedByISPLPM TEXT,
      UpdatedDate TEXT,
      CompletionDate TEXT,
      NotificationSent INTEGER DEFAULT 0,
      NotificationSentDate TEXT,
      ISPLPMRemarks TEXT,
      BatchID TEXT
    );

    CREATE TABLE IF NOT EXISTS batch_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      BatchID TEXT,
      BatchMonth TEXT,
      BatchDate TEXT,
      TotalRequestsSent INTEGER,
      FileName TEXT,
      SentToEmail TEXT,
      SentBy TEXT,
      SentTimestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      displayName TEXT,
      roles TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      EntityType TEXT,
      EntityID TEXT,
      Action TEXT,
      XlsxData TEXT, -- JSON string of data
      PerformedBy TEXT,
      Timestamp TEXT
    );
  `);
  console.log('Database tables ready.');

  // Migration: Add columns if they don't exist
  const migrations = [
    { table: 'cost_center_master', col: 'HOD', type: 'TEXT' },
    { table: 'requests', col: 'HODOld', type: 'TEXT' },
    { table: 'requests', col: 'HODProposed', type: 'TEXT' },
    { table: 'requests', col: 'HODFinal', type: 'TEXT' },
    { table: 'requests', col: 'DomainFinal', type: 'TEXT' },
    { table: 'requests', col: 'ClusterFinal', type: 'TEXT' },
    { table: 'requests', col: 'Cluster1Final', type: 'TEXT' },
    { table: 'requests', col: 'Cluster2Final', type: 'TEXT' },
    { table: 'requests', col: 'ParadigmCodeFinal', type: 'TEXT' },
    { table: 'requests', col: 'ParadigmCodeDescriptionFinal', type: 'TEXT' },
    { table: 'requests', col: 'LocationFinal', type: 'TEXT' },
    { table: 'requests', col: 'ExCoFinal', type: 'TEXT' },
    { table: 'requests', col: 'BatchID', type: 'TEXT' },
    { table: 'users', col: 'roles', type: 'TEXT' }
  ];

  migrations.forEach(m => {
    try {
      db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.col} ${m.type}`);
    } catch (e) { }
  });

  // Seed Users
  const userSeed = [
    ['tejas.nagar123@gmail.com', 'Tejas', 'ADMIN,BUSINESS_MANAGER,PMO,HOD,EXCO,ISPL_PM'],
    ['manager@company.com', 'Sarah', 'BUSINESS_MANAGER'],
    ['pmo@company.com', 'David (Admin)', 'ADMIN,PMO'],
    ['ispl-pm@company.com', 'Alex (ISPL PM)', 'ISPL_PM']
  ];

  const insertUser = db.prepare('INSERT OR REPLACE INTO users (email, displayName, roles) VALUES (?, ?, ?)');
  userSeed.forEach(u => insertUser.run(u[0], u[1], u[2]));

  // Seed Dummy Data
  const seedData = [
    ['CC-1001', 'Global Sales Ops', 'Sales', 'EMEA Sales', 'Alice Johnson', 'Alice Johnson', 'Michael Ross', 'Finance', 'UK Cluster', 'London', 'Surrey', 'P-99', 'Global Sales Paradigm', 'London - Canary Wharf', 'Yes'],
    ['CC-1002', 'Tech Infrastructure', 'IT', 'Cloud Ops', 'Charlie Brown', 'Charlie Brown', 'Donna Paulsen', 'Technology', 'US East', 'New York', 'New Jersey', 'P-88', 'Tech Infrastructure Paradigm', 'New York - Midtown', 'No'],
    ['CC-1003', 'Human Resources', 'HR', 'Recruitment', 'Eve Black', 'Eve Black', 'Rachel Zane', 'Admin', 'APAC', 'Singapore', 'Jurong', 'P-77', 'Core HR Paradigm', 'Singapore - Central', 'No']
  ];

  const checkMaster = db.prepare('SELECT count(*) as count FROM cost_center_master').get();
  if (!checkMaster || checkMaster.count === 0) {
    const insertMaster = db.prepare(`
      INSERT INTO cost_center_master (
        CostCenterCode, CostCenterName, Department, Team, 
        BusinessManager, PMO, HOD, Domain, Cluster, Cluster1, 
        Cluster2, ParadigmCode, ParadigmCodeDescription, Location, ExCo,
        Status, EffectiveDate, LastUpdatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', '2023-01-01', '2023-01-01')
    `);
    seedData.forEach(row => insertMaster.run(
      row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11], row[12], row[13], row[14]
    ));
  }
  console.log('Database initialization complete.');
}

async function performDispatch(sentBy: string, sentByEmail: string) {
  const requests = db.prepare("SELECT * FROM requests WHERE Status IN ('Submitted', 'Pending Monthly Dispatch')").all();
  
  if (requests.length === 0) {
    console.log('No pending requests for dispatch.');
    return;
  }

  const batchMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const batchID = `BATCH-${Date.now()}`;
  
  // 1. Generate Excel (Used for Batch Logging metadata)
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(requests);
  xlsx.utils.book_append_sheet(wb, ws, "Requests");
  const fileName = `Batch_${batchMonth.replace(/ /g, '_')}_${Date.now()}.xlsx`;
  const filePath = path.join(__dirname, fileName);
  xlsx.writeFile(wb, filePath);

  // 2. Update Database
  const batchDate = new Date().toISOString();
  db.prepare(`
    UPDATE requests 
    SET Status = 'Sent to ISPL PM', BatchID = ?, BatchSentDate = ? 
    WHERE Status IN ('Submitted', 'Pending Monthly Dispatch')
  `).run(batchID, batchDate);

  // 3. Log the Batch
  db.prepare(`
    INSERT INTO batch_logs (BatchID, BatchMonth, BatchDate, TotalRequestsSent, FileName, SentToEmail, SentBy, SentTimestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(batchID, batchMonth, batchDate, requests.length, fileName, 'Manual Extraction', sentBy, batchDate);

  // Clean up physical file after logging metadata
  setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 60000);
}

async function startServer() {
  await initDB();
  
  // Setup Automated Monthly Dispatch Job (Runs on the 9th of every month at midnight)
  cron.schedule('0 0 9 * *', async () => {
    console.log('Running Automated Monthly Dispatch Job...');
    try {
      await performDispatch('Automated Job', 'system@controltower.com');
      console.log('Automated Monthly Dispatch Job completed successfully.');
    } catch (error) {
      console.error('Automated Monthly Dispatch Job failed:', error);
    }
  });

  const app = express();

  app.use(express.json());

  app.get('/api/health', (req, res) => res.send('OK'));

  // --- API Routes ---
  app.get('/api/requests', (req, res) => {
    try { res.json(db.prepare('SELECT * FROM requests ORDER BY SubmittedDate DESC').all()); } 
    catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.post('/api/requests', (req, res) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO requests (
          RequestID, RequestType, ExistingCostCenterCode, ExistingCostCenterName,
          ProposedCostCenterCode, ProposedCostCenterName, DepartmentOld, DepartmentProposed,
          TeamOld, TeamProposed, BusinessManagerOld, BusinessManagerProposed,
          PMOOld, PMOProposed, HODOld, HODProposed, DomainOld, DomainProposed, ClusterOld, ClusterProposed,
          Cluster1Old, Cluster1Proposed, Cluster2Old, Cluster2Proposed,
          ParadigmCodeOld, ParadigmCodeProposed, ParadigmCodeDescriptionOld, ParadigmCodeDescriptionProposed,
          LocationOld, LocationProposed, ExCoOld, ExCoProposed,
          Justification, SubmittedBy, SubmittedByEmail,
          SubmittedDate, Status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const r = req.body;
      stmt.run(
        r.RequestID, r.RequestType, r.ExistingCostCenterCode, r.ExistingCostCenterName,
        r.ProposedCostCenterCode, r.ProposedCostCenterName, r.DepartmentOld, r.DepartmentProposed,
        r.TeamOld, r.TeamProposed, r.BusinessManagerOld, r.BusinessManagerProposed,
        r.PMOOld, r.PMOProposed, r.HODOld, r.HODProposed, r.DomainOld, r.DomainProposed, r.ClusterOld, r.ClusterProposed,
        r.Cluster1Old, r.Cluster1Proposed, r.Cluster2Old, r.Cluster2Proposed,
        r.ParadigmCodeOld, r.ParadigmCodeProposed, r.ParadigmCodeDescriptionOld, r.ParadigmCodeDescriptionProposed,
        r.LocationOld, r.LocationProposed, r.ExCoOld, r.ExCoProposed,
        r.Justification, r.SubmittedBy, r.SubmittedByEmail,
        r.SubmittedDate, r.Status
      );
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.patch('/api/requests/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const keys = Object.keys(updates);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => updates[k]);
      db.prepare(`UPDATE requests SET ${setClause} WHERE id = ?`).run(...values, id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.get('/api/master', (req, res) => {
    res.json(db.prepare('SELECT * FROM cost_center_master ORDER BY CostCenterCode ASC').all());
  });

  app.get('/api/master/export', (req, res) => {
    try {
      const masters = db.prepare('SELECT * FROM cost_center_master ORDER BY CostCenterCode ASC').all() as any[];
      
      const exportData = masters.map(m => ({
        'CC Code': m.CostCenterCode,
        'CC Name': m.CostCenterName,
        'Department': m.Department,
        'Team': m.Team,
        'Business Manager': m.BusinessManager,
        'PMO': m.PMO,
        'HOD': m.HOD,
        'Domain': m.Domain,
        'Cluster': m.Cluster,
        'Paradigm Code': m.ParadigmCode,
        'Location': m.Location,
        'ExCo': m.ExCo,
        'Status': m.Status,
        'Effective Date': m.EffectiveDate
      }));

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(exportData);
      xlsx.utils.book_append_sheet(wb, ws, "MasterData");
      
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Cost_Center_Master.xlsx');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: 'Export failed' });
    }
  });

  app.get('/api/audit-logs', (req, res) => {
    try {
      res.json(db.prepare('SELECT * FROM audit_logs ORDER BY Timestamp DESC LIMIT 200').all());
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.post('/api/master', (req, res) => {
    try {
      const m = req.body;
      const userName = req.headers['x-user-name'] || 'System';
      const userEmail = req.headers['x-user-email'] || 'unknown';
      const performedBy = req.headers['x-user-name'] ? `${userName} (${userEmail})` : userEmail;
      
      const existing = db.prepare('SELECT * FROM cost_center_master WHERE CostCenterCode = ?').get(m.CostCenterCode);
      const action = existing ? 'UPDATE' : 'CREATE';

      const stmt = db.prepare(`
        INSERT INTO cost_center_master (
          CostCenterCode, CostCenterName, Department, Team, 
          BusinessManager, PMO, HOD, Domain, Cluster, Cluster1, 
          Cluster2, ParadigmCode, ParadigmCodeDescription, Location, ExCo,
          Status, EffectiveDate, LastUpdatedDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(CostCenterCode) DO UPDATE SET
          CostCenterName = excluded.CostCenterName,
          Department = excluded.Department,
          Team = excluded.Team,
          BusinessManager = excluded.BusinessManager,
          PMO = excluded.PMO,
          HOD = excluded.HOD,
          Domain = excluded.Domain,
          Cluster = excluded.Cluster,
          Cluster1 = excluded.Cluster1,
          Cluster2 = excluded.Cluster2,
          ParadigmCode = excluded.ParadigmCode,
          ParadigmCodeDescription = excluded.ParadigmCodeDescription,
          Location = excluded.Location,
          ExCo = excluded.ExCo,
          LastUpdatedDate = excluded.LastUpdatedDate
      `);
      stmt.run(
        m.CostCenterCode, m.CostCenterName, m.Department, m.Team,
        m.BusinessManager, m.PMO, m.HOD, m.Domain, m.Cluster, m.Cluster1,
        m.Cluster2, m.ParadigmCode, m.ParadigmCodeDescription, m.Location, m.ExCo,
        m.Status, m.EffectiveDate, m.LastUpdatedDate
      );

      // Audit Log
      db.prepare(`
        INSERT INTO audit_logs (EntityType, EntityID, Action, XlsxData, PerformedBy, Timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('CostCenterMaster', m.CostCenterCode, action, JSON.stringify(m), performedBy, new Date().toISOString());

      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.delete('/api/master/:id', (req, res) => {
    try {
      const { id } = req.params;
      const userName = req.headers['x-user-name'] || 'System';
      const userEmail = req.headers['x-user-email'] || 'unknown';
      const performedBy = req.headers['x-user-name'] ? `${userName} (${userEmail})` : userEmail;
      const item = db.prepare('SELECT * FROM cost_center_master WHERE id = ?').get(id);
      
      if (item) {
        db.prepare(`
          INSERT INTO audit_logs (EntityType, EntityID, Action, XlsxData, PerformedBy, Timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('CostCenterMaster', item.CostCenterCode, 'DELETE', JSON.stringify(item), performedBy, new Date().toISOString());
      }

      db.prepare('DELETE FROM cost_center_master WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.get('/api/batches', (req, res) => {
    res.json(db.prepare('SELECT * FROM batch_logs ORDER BY BatchDate DESC').all());
  });

  // --- User Management API ---
  app.get('/api/users', (req, res) => {
    try { res.json(db.prepare('SELECT * FROM users').all()); }
    catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.post('/api/users', (req, res) => {
    try {
      const { email, displayName, roles } = req.body;
      db.prepare('INSERT INTO users (email, displayName, roles) VALUES (?, ?, ?)').run(email, displayName, roles);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.patch('/api/users/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const keys = Object.keys(updates);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => updates[k]);
      db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.delete('/api/users/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  });

  app.post('/api/dispatch', async (req, res) => {
    try {
      const { sentByEmail, sentBy } = req.body;
      await performDispatch(sentBy || 'Admin', sentByEmail);
      res.json({ success: true });
    } catch (error) { 
      console.error(error);
      res.status(500).json({ error: 'Failed' }); 
    }
  });

  app.post('/api/notify-completion', (req, res) => {
    res.json({ success: true });
  });

  app.get('/api/batches/:batchId/download', (req, res) => {
    try {
      const { batchId } = req.params;
      const requests = db.prepare('SELECT * FROM requests WHERE BatchID = ?').all() as any[];
      
      if (requests.length === 0) {
        return res.status(404).json({ error: 'Batch not found or empty' });
      }

      const exportData = requests.map(p => ({
        RequestID: p.RequestID,
        Type: p.RequestType,
        ExistingCode: p.ExistingCostCenterCode,
        ProposedCode: p.ProposedCostCenterCode,
        ProposedName: p.ProposedCostCenterName,
        Requester: p.SubmittedBy,
        Status: p.Status,
        SubmittedDate: p.SubmittedDate
      }));

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(exportData);
      xlsx.utils.book_append_sheet(wb, ws, "Requests");
      
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Batch_${batchId}.xlsx`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: 'Download failed' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server Lifecycle Error:", err);
});
