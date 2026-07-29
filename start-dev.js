import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const isWindows = process.platform === 'win32';
const backendDir = path.resolve('Backend');
const venvDir = path.join(backendDir, 'venv');
const pythonExec = isWindows 
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');
const pipExec = isWindows
  ? path.join(venvDir, 'Scripts', 'pip.exe')
  : path.join(venvDir, 'bin', 'pip');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`> Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

async function setupBackend() {
  if (fs.existsSync(venvDir) && fs.existsSync(pythonExec)) {
    console.log('Python virtual environment found.');
    return;
  }

  console.log('Python virtual environment not found. Setting up...');
  
  let pythonCmd = 'python';
  try {
    await runCommand('python', ['--version']);
  } catch (err) {
    try {
      await runCommand('python3', ['--version']);
      pythonCmd = 'python3';
    } catch (e) {
      console.error('Python was not found in system PATH. Please install Python.');
      process.exit(1);
    }
  }

  console.log(`Creating virtual environment using ${pythonCmd}...`);
  await runCommand(pythonCmd, ['-m', 'venv', 'venv'], { cwd: backendDir });

  console.log('Installing Python dependencies from requirements.txt...');
  await runCommand(pipExec, ['install', '-r', 'requirements.txt'], { cwd: backendDir });
}

async function start() {
  try {
    await setupBackend();
    
    console.log('Starting Backend and Frontend services...');
    
    console.log(`> Launching Backend: ${pythonExec} run.py`);
    const backendProc = spawn(pythonExec, [path.join(backendDir, 'run.py')], {
      cwd: backendDir,
      stdio: 'inherit'
    });
    
    console.log(`> Launching Frontend: npx vite`);
    const viteCmd = isWindows ? 'npx.cmd' : 'npx';
    const frontendProc = spawn(viteCmd, ['vite'], {
      stdio: 'inherit',
      shell: true
    });
    
    const cleanup = () => {
      console.log('\nShutting down services...');
      backendProc.kill();
      frontendProc.kill();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    backendProc.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      frontendProc.kill();
      process.exit(code || 0);
    });
    
    frontendProc.on('exit', (code) => {
      console.log(`Frontend process exited with code ${code}`);
      backendProc.kill();
      process.exit(code || 0);
    });
    
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
}

start();
