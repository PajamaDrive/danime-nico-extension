export interface NicoComment {
  id: string;
  text: string;
  vpos: number;
  userId: string;
  command: CommentCommand;
}

export interface CommentCommand {
  color?: string;
  size?: 'small' | 'medium' | 'big';
  position?: 'top' | 'bottom' | 'naka';
}

export interface NicoThreadKey {
  threadId: string;
  key: string;
  service: string;
}

export interface NicoSession {
  recipeId: string;
  contentId: string;
}

export function parseCommand(cmdString: string): CommentCommand {
  const parts = cmdString.split(/\s+/);
  const command: CommentCommand = {};
  
  parts.forEach(part => {
    // カラー（ざっくり）
    if (part === 'red') command.color = '#ff0000';
    else if (part === 'pink') command.color = '#ff8080';
    else if (part === 'orange') command.color = '#ffc000';
    else if (part === 'yellow') command.color = '#ffff00';
    else if (part === 'green') command.color = '#00ff00';
    else if (part === 'cyan') command.color = '#00ffff';
    else if (part === 'blue') command.color = '#0000ff';
    else if (part === 'purple') command.color = '#c000ff';
    else if (part === 'white') command.color = '#ffffff';
    
    // サイズ
    if (part === 'big') command.size = 'big';
    else if (part === 'small') command.size = 'small';
    
    // 位置
    if (part === 'ue') command.position = 'top';
    else if (part === 'shita') command.position = 'bottom';
  });
  
  return command;
}

export function formatVposToTime(vpos: number): string {
  const totalSeconds = Math.floor(vpos / 100);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
