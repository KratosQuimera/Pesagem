using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace HaocPesagem
{
    static class Program
    {
        private static HttpListener _listener;
        private static string _baseFolder;
        private static int _port = 34567;

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string exePath = AppDomain.CurrentDomain.BaseDirectory;
                
                // Locate dist or web files
                _baseFolder = Path.Combine(exePath, "dist");
                if (!Directory.Exists(_baseFolder))
                {
                    _baseFolder = exePath;
                }

                // Start local embedded web server for 100% offline access
                StartWebServer();

                // Open in Edge or Chrome App Mode (borderless, native-like window)
                string appUrl = "http://localhost:" + _port + "/";
                LaunchAppMode(appUrl);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao inicializar Pesagem HAOC:\n" + ex.Message, "HAOC Pesagem", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void LaunchAppMode(string url)
        {
            string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
            if (!File.Exists(edgePath))
            {
                edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
            }

            string chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
            if (!File.Exists(chromePath))
            {
                chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe");
            }

            ProcessStartInfo psi = new ProcessStartInfo();
            if (File.Exists(edgePath))
            {
                psi.FileName = edgePath;
                psi.Arguments = "--app=" + url + " --window-size=1280,820";
            }
            else if (File.Exists(chromePath))
            {
                psi.FileName = chromePath;
                psi.Arguments = "--app=" + url + " --window-size=1280,820";
            }
            else
            {
                psi.FileName = url;
                psi.UseShellExecute = true;
            }

            Process p = Process.Start(psi);
            if (p != null)
            {
                p.WaitForExit();
            }
            
            // Stop server when window is closed
            if (_listener != null && _listener.IsListening)
            {
                _listener.Stop();
            }
        }

        static void StartWebServer()
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add("http://localhost:" + _port + "/");
            _listener.Start();

            ThreadPool.QueueUserWorkItem((o) =>
            {
                while (_listener.IsListening)
                {
                    try
                    {
                        var context = _listener.GetContext();
                        ThreadPool.QueueUserWorkItem((c) => HandleRequest((HttpListenerContext)c), context);
                    }
                    catch { break; }
                }
            });
        }

        static void HandleRequest(HttpListenerContext context)
        {
            try
            {
                string rawPath = context.Request.Url.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(rawPath)) rawPath = "index.html";
                string filePath = Path.Combine(_baseFolder, rawPath);

                if (!File.Exists(filePath))
                {
                    filePath = Path.Combine(_baseFolder, "index.html");
                }

                if (File.Exists(filePath))
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    string ext = Path.GetExtension(filePath).ToLowerInvariant();
                    string mime = "text/html; charset=utf-8";
                    if (ext == ".js") mime = "application/javascript";
                    else if (ext == ".css") mime = "text/css";
                    else if (ext == ".png") mime = "image/png";
                    else if (ext == ".svg") mime = "image/svg+xml";
                    else if (ext == ".json") mime = "application/json";

                    context.Response.ContentType = mime;
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
                context.Response.OutputStream.Close();
            }
            catch { }
        }
    }
}
