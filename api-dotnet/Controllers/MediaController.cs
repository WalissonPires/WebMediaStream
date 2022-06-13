using ATL;
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
        public async Task<IActionResult> GetMedias()
        {
            var files = System.IO.Directory.GetFiles(GetMediasFolder());
            var medias = new List<Media>();

            foreach(var filename in files)
            {
                var track = new Track(filename);
                var picture = track.EmbeddedPictures.FirstOrDefault();
                if (picture != null)
                {
                    var picturePath = Path.Combine(GetPicturesFolder(), GetThumbnailNameFromFilename(filename));
                    using(var fileStream = System.IO.File.Create(picturePath))
                    using (var pictureStream = new System.IO.MemoryStream(picture.PictureData))
                    {
                        await pictureStream.CopyToAsync(fileStream);
                    }
                }

                medias.Add(new Media
                {
                    Name = Path.GetFileName(filename),
                    Type = GetMediaTypeFromFilename(filename),
                    Link = "media/" + Path.GetFileName(filename),
                    Artist = String.IsNullOrEmpty(track.Artist) ? null : track.Artist,
                    Album = String.IsNullOrEmpty(track.Album) ? null : track.Album,
                    Title = String.IsNullOrEmpty(track.Title) ? null : track.Title,
                    Duration = track.Duration,
                    ThumbnailLink = picture != null ? "media/" + Path.GetFileName(filename) + "/thumbnail" : null,
                });
            }

            return Ok(medias);
        }

        [HttpGet("{filename}")]
        public IActionResult GetMedia(string filename)
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

        [HttpGet("{filename}/thumbnail")]
        public IActionResult GetMediaThumbnail(string filename)
        {
            var filePath = Path.Combine(GetPicturesFolder(), GetThumbnailNameFromFilename(filename));
            _logger.LogDebug("Getting {filename}", filePath);

            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogDebug("File {filename} not exists", filePath);
                return NotFound();
            }

            var fileStream = System.IO.File.OpenRead(filePath);
            var mimeType = MimeTypeUtils.GetMimeTypeForFileExtension(filePath);
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
            return Path.Combine(Environment.CurrentDirectory, "out", "medias");
        }

        private string GetPicturesFolder()
        {
            return Path.Combine(Environment.CurrentDirectory, "out", "pictures");
        }

        private string GetThumbnailNameFromFilename(string filename)
        {
            var imageName = Path.GetFileNameWithoutExtension(filename);
            imageName = imageName + ".artwork.jpg";

            return imageName;
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
        public string? Artist { get; set; }
        public string? Album { get; set; }
        public string? Title { get; set; }
        public float? Duration { get; set; }
        public string? ThumbnailLink { get; set; }
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