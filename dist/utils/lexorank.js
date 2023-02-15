"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexorank = void 0;
class Lexorank {
    MIN_CHAR = this.byte("0");
    MAX_CHAR = this.byte("z");
    insert(prev, next) {
        if (prev == "") {
            prev = this.string(this.MIN_CHAR);
        }
        if (next == "") {
            next = this.string(this.MAX_CHAR);
        }
        let rank = "";
        let i = 0;
        while (true) {
            let prevChar = this.getChar(prev, i, this.MIN_CHAR);
            let nextChar = this.getChar(next, i, this.MAX_CHAR);
            if (prevChar == nextChar) {
                rank += this.string(prevChar);
                i++;
                continue;
            }
            let midChar = this.mid(prevChar, nextChar);
            if (midChar == prevChar || midChar == nextChar) {
                rank += this.string(prevChar);
                i++;
                continue;
            }
            rank += this.string(midChar);
            break;
        }
        if (rank >= next) {
            return [prev, false];
        }
        return [rank, true];
    }
    string(byte) {
        return String.fromCharCode(byte);
    }
    byte(char) {
        return char.charCodeAt(0);
    }
    mid(prev, next) {
        // TODO: consider to use 8 steps each jump
        return Math.floor((prev + next) / 2);
    }
    getChar(s, i, defaultChar) {
        console.log(s, i);
        if (i >= s.length) {
            return defaultChar;
        }
        return this.byte(s.charAt(i));
    }
}
exports.Lexorank = Lexorank;
