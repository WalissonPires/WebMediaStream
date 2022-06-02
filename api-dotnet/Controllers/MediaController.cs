using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace WebApiMediaStream.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MediaController : ControllerBase
    {
        private readonly ILogger<MediaController> _logger;

        public MediaController(ILogger<MediaController> logger)
        {
            _logger = logger;
        }

        [HttpGet("")]
        public IActionResult GetMedias()
        {
            var files = System.IO.Directory.GetFiles(GetMediasFolder());
            var medias = files.Select(filename => new Media 
            { 
                Name = Path.GetFileName(filename),
                Type = GetMediaTypeFromFilename(filename),
                Link = "media/" + Path.GetFileName(filename)
            }).ToArray();

            return Ok(medias);
        }

        [HttpGet("{filename}")]
        public IActionResult GetStream(string filename)
        {
            var filePath = Path.Combine(GetMediasFolder(), filename);
            _logger.LogDebug("Getting {filename}", filePath);

            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogDebug("File {filename} not exists", filePath);
                return NotFound();
            }

            var fileStream = System.IO.File.OpenRead(filePath);
            var mimeType = MimeTypeUtils.GetMimeTypeForFileExtension(filename);
            return new FileStreamResult(fileStream, mimeType);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFiles([FromForm]List<IFormFile> files)
        {
            var resultado = new List<Media>();

            foreach(var formFile in files)
            {
                var filePath = Path.Combine(GetMediasFolder(), formFile.FileName);
                using(var stream = System.IO.File.Create(filePath))
                {
                    await formFile.CopyToAsync(stream);
                }

                resultado.Add(new Media { Name = formFile.FileName });
            }

            return Ok(resultado);
        }

        private string GetMediasFolder()
        {
            return Path.Combine(Environment.CurrentDirectory, "medias");
        }

        private string? GetMediaTypeFromFilename(string filename)
        {
            if (filename.EndsWith("mp3"))
                return "audio";

            if (filename.EndsWith("mp4"))
                return "video";

            return null;
        }
    }


    class Media
    {
        public string? Name { get; set; }
        public string? Link { get; set; }
        public string? Type { get; set; }
    }

    class MimeTypeUtils
    {
        public static string GetMimeTypeForFileExtension(string filePath)
        {
            const string DefaultContentType = "application/octet-stream";

            var provider = new FileExtensionContentTypeProvider();

            if (!provider.TryGetContentType(filePath, out string? contentType))
            {
                contentType = DefaultContentType;
            }

            return contentType;
        }
    }
}