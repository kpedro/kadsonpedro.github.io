document.addEventListener("DOMContentLoaded", function () {
    // Verifica se o marked.js está carregado
    if (typeof marked === 'undefined') {
        console.error('Marked.js não está carregado!');
        return;
    }

    // Configuração do Marked
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
        sanitize: false
    });

    // Função para carregar um post específico
    function loadPost() {
        const postId = new URLSearchParams(window.location.search).get("post");
        console.log("Carregando post:", postId);

        if (!postId) {
            showErrorMessage("Post não especificado");
            return;
        }

        fetch(`posts/${postId}.md`)
            .then(response => {
                console.log("Status da resposta:", response.status);
                if (!response.ok) throw new Error("Post não encontrado");
                return response.text();
            })
            .then(markdown => {
                console.log("Markdown carregado");
                // Configuração do Marked para processar imagens corretamente
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: true,
                    mangle: false,
                    sanitize: false,
                    baseUrl: '/' // Ajuda com caminhos relativos
                });

                const html = marked.parse(markdown);
                
                // Atualiza o conteúdo
                const postContent = document.getElementById("post-content");
                const postTitle = document.getElementById("post-title");
                const postMeta = document.getElementById("post-meta");
                
                if (postContent) postContent.innerHTML = html;

                // Extrai o título e metadados
                const titleMatch = markdown.match(/^# (.*$)/m);
                const dateMatch = markdown.match(/📅 (.*$)/m);
                const authorMatch = markdown.match(/✍️ (.*$)/m);
                const categoryMatch = markdown.match(/🏷️ (.*$)/m);
                // Extrai a primeira imagem para thumbnail
                const imageMatch = markdown.match(/!\[.*?\]\((.*?)\)/);

                // Atualiza meta tags para compartilhamento
                if (imageMatch) {
                    const imagePath = imageMatch[1].replace('../', '/');
                    document.getElementById('og-image').content = window.location.origin + imagePath;
                }

                if (titleMatch && postTitle) {
                    postTitle.textContent = titleMatch[1];
                    document.title = `${titleMatch[1]} - Kadson Pedro`;
                    document.getElementById('og-title').content = titleMatch[1];
                }

                // Atualiza descrição para compartilhamento
                const firstParagraph = markdown.split('\n\n')[2]; // Pega o primeiro parágrafo após metadados
                if (firstParagraph) {
                    document.getElementById('og-description').content = firstParagraph.replace(/[#*]/g, '');
                }

                if (postMeta && dateMatch && authorMatch && categoryMatch) {
                    postMeta.innerHTML = `
                        <span class="post-date">${dateMatch[1]}</span> | 
                        <span class="post-author">${authorMatch[1]}</span> | 
                        <span class="post-category">${categoryMatch[1]}</span>
                    `;
                }

                setupShareButtons(window.location.href, document.title);

                const postIdInput = document.getElementById("post-id");
                if (postIdInput) {
                    postIdInput.value = postId;
                }

                const postTitleInput = document.getElementById('post-title-input');
                if (postTitleInput && titleMatch) {
                    postTitleInput.value = titleMatch[1];
                }
            })
            .catch(error => {
                console.error("Erro ao carregar post:", error);
                showErrorMessage(error.message);
            });
    }

    // Função para mostrar mensagem de erro
    function showErrorMessage(message) {
        const postContent = document.getElementById("post-content");
        if (postContent) {
            postContent.innerHTML = `
                <div class="error-message">
                    <h2>Ops! Algo deu errado.</h2>
                    <p>${message}</p>
                    <a href="index.html" class="read-more">Voltar para a página inicial</a>
                </div>
            `;
        }
    }

    // Função para configurar botões de compartilhamento
    function setupShareButtons(url, title) {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);

        const shareButtons = {
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`
        };

        Object.entries(shareButtons).forEach(([platform, shareUrl]) => {
            const button = document.getElementById(`share-${platform}`);
            if (button) {
                button.href = shareUrl;
                button.target = '_blank';
                button.rel = 'noopener noreferrer';
            }
        });
    }

    function setupCommentForm() {
        const form = document.getElementById('comment-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Atualiza estado do botão
            const button = form.querySelector('.submit-button');
            const buttonText = button.querySelector('.button-text');
            const buttonLoader = button.querySelector('.button-loader');
            const feedback = document.getElementById('form-feedback');

            buttonText.style.display = 'none';
            buttonLoader.style.display = 'inline-block';
            button.disabled = true;
            feedback.style.display = 'none';

            // Prepara os dados do template
            const templateParams = {
                post_id: document.getElementById('post-id').value,
                post_title: document.getElementById('post-title-input').value,
                from_name: document.getElementById('name').value,
                from_email: document.getElementById('email').value,
                message: document.getElementById('message').value,
                post_url: window.location.href
            };

            // Antes do envio do email
            console.log('Enviando email com params:', templateParams);
            console.log('Service ID:', 'service_sfcgswc');
            console.log('Template ID:', 'template_um5hyie');

            // Envia o email
            emailjs.send(
                'service_sfcgswc',
                'template_um5hyie',
                templateParams,
                '639peYCntwvgbJXOH'
            )
            .then(function(response) {
                console.log('SUCCESS!', response.status, response.text);
                feedback.textContent = 'Comentário enviado com sucesso! Obrigado pelo feedback.';
                feedback.className = 'form-feedback success';
                feedback.style.display = 'block';
                form.reset();
            })
            .catch(function(error) {
                console.error('FAILED...', error);
                feedback.textContent = `Erro ao enviar: ${error.text}`;
                feedback.className = 'form-feedback error';
                feedback.style.display = 'block';
            })
            .finally(function() {
                // Restaura o estado do botão
                buttonText.style.display = 'inline-block';
                buttonLoader.style.display = 'none';
                button.disabled = false;
            });
        });
    }

    // Inicializa se estiver na página de post
    if (window.location.pathname.includes('post.html')) {
        loadPost();
        setupCommentForm();
    }
});