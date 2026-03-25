import { NicoComment } from './core';

class CommentOverlay {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activeComments: { comment: NicoComment, x: number, y: number, width: number }[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'nico-comment-overlay';
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    this.setupStyles();
    this.setupResize();
    this.startAnimation();
  }

  private setupStyles() {
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '9999';
    
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    
    // dアニメの動画プレイヤーコンテナを探す
    const player = document.querySelector('.video-player-container') || document.body;
    player.appendChild(this.container);
    
    this.resize();
  }

  private setupResize() {
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  public addComment(comment: NicoComment) {
    this.ctx.font = 'bold 36px "FixedSys", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif';
    const metrics = this.ctx.measureText(comment.text);
    
    this.activeComments.push({
      comment,
      x: this.canvas.width,
      y: Math.random() * (this.canvas.height - 40) + 40,
      width: metrics.width
    });
  }

  private startAnimation() {
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.activeComments = this.activeComments.filter(ac => {
        ac.x -= 2; // 移動速度
        
        this.ctx.fillStyle = ac.comment.command.color || 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(ac.comment.text, ac.x, ac.y);
        this.ctx.fillText(ac.comment.text, ac.x, ac.y);
        
        return ac.x + ac.width > 0;
      });
      
      requestAnimationFrame(animate);
    };
    animate();
  }
}

const overlay = new CommentOverlay();

// backgroundからのメッセージ待ち
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "NEW_COMMENTS") {
    message.comments.forEach((c: NicoComment) => overlay.addComment(c));
  }
});
