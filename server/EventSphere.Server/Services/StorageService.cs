using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace EventSphere.Server.Services;

/* Uploads proof images to Cloudinary. Credentials come from the "Cloudinary"
   config section (environment overrides: Cloudinary__CloudName,
   Cloudinary__ApiKey, Cloudinary__ApiSecret). When Cloudinary is not
   configured the service falls back to the server's local wwwroot/uploads
   folder, so the app keeps working and old relative paths keep resolving. */
public class StorageService
{
    private readonly Cloudinary? _cloudinary;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<StorageService> _logger;

    public StorageService(IConfiguration config, IWebHostEnvironment env, ILogger<StorageService> logger)
    {
        _env = env;
        _logger = logger;

        var name = config["Cloudinary:CloudName"];
        var key = config["Cloudinary:ApiKey"];
        var secret = config["Cloudinary:ApiSecret"];
        if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(secret))
        {
            _cloudinary = new Cloudinary(new Account(name, key, secret))
            {
                Api = { Secure = true }
            };
        }
    }

    public bool UseCloudinary => _cloudinary != null;

    /* Saves an uploaded image and returns where it can be read back from: an
       absolute https://res.cloudinary.com/... URL when Cloudinary is active,
       otherwise a server-relative /uploads/<folder>/... path. On any Cloudinary
       failure we degrade to disk so an upload never breaks the whole request. */
    public async Task<string> SaveImageAsync(byte[] bytes, string fileName, string folder, CancellationToken ct = default)
    {
        if (_cloudinary != null)
        {
            try
            {
                using var stream = new MemoryStream(bytes);
                var upload = new ImageUploadParams
                {
                    File = new FileDescription(fileName, stream),
                    Folder = folder,
                    Overwrite = true,
                    UniqueFilename = true,
                };
                var result = await _cloudinary.UploadAsync(upload);
                if (result.SecureUrl != null)
                {
                    _logger.LogInformation("Uploaded {File} to Cloudinary {PublicId}", fileName, result.PublicId);
                    return result.SecureUrl.AbsoluteUri;
                }
                _logger.LogWarning("Cloudinary upload returned no URL ({Error}); falling back to disk", result.Error?.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Cloudinary upload failed for {File}; falling back to disk", fileName);
            }
        }

        var root = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var relDir = Path.Combine("uploads", folder);
        Directory.CreateDirectory(Path.Combine(root, relDir));
        await System.IO.File.WriteAllBytesAsync(Path.Combine(root, relDir, fileName), bytes, ct);
        return "/" + Path.Combine(relDir, fileName).Replace('\\', '/');
    }
}